import { Server, Socket } from 'socket.io';
import { Player } from './Player';
import { Card, Deck } from './Deck';
import { RuleEngine } from './rules/RuleEngine';

export class Game {
  private static games: Map<string, Game> = new Map();
  private static socketGameMap: Map<string, string> = new Map();

  public gameId: string;
  private io: Server;
  private players: Player[] = [];
  private turnIndex: number = 0;
  private centralPile: Card[] = [];
  private ruleEngine: RuleEngine;
  private isGameStarted: boolean = false;
  private slapTimeout: NodeJS.Timeout | null = null;

  private constructor(io: Server, gameId: string, rules: any) {
    this.io = io;
    this.gameId = gameId;
    this.ruleEngine = new RuleEngine(rules);
  }

  public static createGame(io: Server, rules: any): Game {
    const gameId = Game.generateGameId();
    const game = new Game(io, gameId, rules);
    Game.games.set(gameId, game);
    return game;
  }

  public static getGameById(gameId: string): Game | undefined {
    return Game.games.get(gameId);
  }

  public static getGameBySocket(socket: Socket): Game | undefined {
    const gameId = Game.socketGameMap.get(socket.id);
    if (gameId) {
      return Game.games.get(gameId);
    }
    return undefined;
  }

  public static handleDisconnect(socket: Socket) {
    const game = Game.getGameBySocket(socket);
    if (game) {
      game.removePlayer(socket);
    }
  }

  private static generateGameId(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  public addPlayer(socket: Socket, playerName: string) {
    if (this.isGameStarted) {
      socket.emit('error', { message: 'Game already started.' });
      return;
    }

    const player = new Player(socket, playerName);
    this.players.push(player);
    socket.join(this.gameId);
    Game.socketGameMap.set(socket.id, this.gameId);

    this.io.to(this.gameId).emit('player_joined', {
      playerName: player.name,
      players: this.players.map((p) => p.name),
    });

    if (this.players.length >= this.ruleEngine.getMinimumPlayers()) {
      this.startGame();
    }
  }

  public removePlayer(socket: Socket) {
    const playerIndex = this.players.findIndex((p) => p.socket.id === socket.id);
    if (playerIndex !== -1) {
      const player = this.players.splice(playerIndex, 1)[0];
      this.io.to(this.gameId).emit('player_left', { playerName: player.name });
      Game.socketGameMap.delete(socket.id);

      if (this.players.length === 0) {
        Game.games.delete(this.gameId);
      } else {
        if (this.isGameStarted) {
          if (playerIndex <= this.turnIndex) {
            this.turnIndex = (this.turnIndex - 1 + this.players.length) % this.players.length;
          }
          this.checkForWinner();
        }
      }
    }
  }

  private startGame() {
    this.isGameStarted = true;
    const deck = Deck.createShuffledDeck();
    Deck.dealCards(deck, this.players);

    this.io.to(this.gameId).emit('game_started', {
      players: this.players.map((p) => p.name),
    });

    this.nextTurn();
  }

  private nextTurn() {
    if (this.players.length === 0) return;

    this.turnIndex = this.turnIndex % this.players.length;
    const currentPlayer = this.players[this.turnIndex];
    this.io.to(this.gameId).emit('turn', { playerName: currentPlayer.name });

    currentPlayer.socket.emit('your_turn');

    // Set a time limit for the player to play a card
    const turnTimeLimit = this.ruleEngine.getTurnTimeLimit();
    const turnTimeout = setTimeout(() => {
      this.io.to(this.gameId).emit('player_timeout', { playerName: currentPlayer.name });
      this.advanceTurn();
    }, turnTimeLimit);

    currentPlayer.socket.once('play_card', () => {
      clearTimeout(turnTimeout);
      this.playCard(currentPlayer);
    });
  }

  public handlePlayCard(socket: Socket) {
    const player = this.getPlayerBySocket(socket);
    if (player && player.socket.id === socket.id && this.players[this.turnIndex].socket.id === socket.id) {
      this.playCard(player);
    } else {
      socket.emit('error', { message: 'Not your turn.' });
    }
  }

  private playCard(player: Player) {
    const card = player.playCard();
    if (card) {
      this.centralPile.push(card);
      this.io.to(this.gameId).emit('card_played', {
        playerName: player.name,
        card: card.code,
      });

      const faceCardChallenge = this.ruleEngine.checkFaceCardChallenge(card);
      if (faceCardChallenge > 0) {
        this.handleFaceCardChallenge(faceCardChallenge);
      } else {
        const slapCondition = this.ruleEngine.checkSlapCondition(this.centralPile);
        if (slapCondition) {
          this.waitForSlap();
        } else {
          this.advanceTurn();
        }
      }
    } else {
      // Player is out of cards
      this.io.to(this.gameId).emit('player_out', { playerName: player.name });
      this.players.splice(this.turnIndex, 1);
      this.checkForWinner();
    }
  }

  private handleFaceCardChallenge(challengeCount: number) {
    this.turnIndex = (this.turnIndex + 1) % this.players.length;
    const nextPlayer = this.players[this.turnIndex];

    const playNextCard = () => {
      const card = nextPlayer.playCard();
      if (card) {
        this.centralPile.push(card);
        this.io.to(this.gameId).emit('card_played', {
          playerName: nextPlayer.name,
          card: card.code,
        });

        const isFaceCard = this.ruleEngine.isFaceCard(card);
        const isCounterCard = this.ruleEngine.isCounterCard(card);

        if (isFaceCard || isCounterCard) {
          // Challenge is countered
          this.handleFaceCardChallenge(this.ruleEngine.getFaceCardChallengeCount(card));
        } else {
          challengeCount--;
          if (challengeCount > 0) {
            playNextCard();
          } else {
            // Challenge failed
            const previousPlayerIndex = (this.turnIndex - 1 + this.players.length) % this.players.length;
            const winner = this.players[previousPlayerIndex];
            winner.collectPile(this.centralPile);
            this.centralPile = [];
            this.io.to(this.gameId).emit('challenge_failed', {
              winner: winner.name,
              loser: nextPlayer.name,
            });
            this.turnIndex = previousPlayerIndex;
            this.advanceTurn();
          }
        }
      } else {
        // Next player is out of cards
        this.io.to(this.gameId).emit('player_out', { playerName: nextPlayer.name });
        this.players.splice(this.turnIndex, 1);
        this.turnIndex = this.turnIndex % this.players.length;
        this.checkForWinner();
      }
    };

    playNextCard();
  }

  private waitForSlap() {
    if (this.slapTimeout) {
      clearTimeout(this.slapTimeout);
    }

    const slapTimeLimit = this.ruleEngine.getSlapTimeLimit();

    this.io.to(this.gameId).emit('slap_possible', { timeLimit: slapTimeLimit });

    this.slapTimeout = setTimeout(() => {
      this.advanceTurn();
    }, slapTimeLimit);
  }

  public handleSlapAttempt(socket: Socket) {
    if (this.slapTimeout) {
      clearTimeout(this.slapTimeout);
    }

    const player = this.getPlayerBySocket(socket);
    if (player) {
      const success = this.ruleEngine.validateSlap(this.centralPile);
      if (success) {
        player.collectPile(this.centralPile);
        this.centralPile = [];

        // Handle social rules
        const socialAction = this.ruleEngine.getSocialAction(player, this.players, this.centralPile);

        this.io.to(this.gameId).emit('slap_success', {
          playerName: player.name,
          socialAction: socialAction,
        });

        this.turnIndex = this.players.indexOf(player);
        this.advanceTurn();
      } else {
        // Penalty for incorrect slap
        const penaltyCard = player.givePenaltyCard();
        if (penaltyCard) {
          this.centralPile.push(penaltyCard);
        }
        this.io.to(this.gameId).emit('slap_fail', { playerName: player.name });
        this.advanceTurn();
      }
    }
  }

  private advanceTurn() {
    this.turnIndex = (this.turnIndex + 1) % this.players.length;
    this.nextTurn();
  }

  private getPlayerBySocket(socket: Socket): Player | undefined {
    return this.players.find((player) => player.socket.id === socket.id);
  }

  private checkForWinner() {
    if (this.players.length === 1) {
      this.io.to(this.gameId).emit('game_over', { winner: this.players[0].name });
      Game.games.delete(this.gameId);
    } else if (this.players.length > 1) {
      this.advanceTurn();
    }
  }
}
