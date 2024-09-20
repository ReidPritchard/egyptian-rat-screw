import { Server, Socket } from 'socket.io';
import { Player } from './Player';
import { Deck } from './Deck';
import { RuleEngine } from './rules/RuleEngine';
import {
  GameState,
  PlayerInfo,
  SlapRule,
  Card,
  ClientGameState,
  PlayerAction,
  PlayerActionType,
  GameSettings,
  SlapRuleAction,
  VoteState,
  Vote,
  CardChallenge,
} from '../types';
import { SocketEvents } from '../socketEvents';
import { defaultSlapRules } from './rules/SlapRules';

export class Game {
  public gameId: string;
  private io: Server;

  private players: Player[] = [];
  private turnIndex: number = 0;

  private centralPile: Card[] = [];
  private ruleEngine: RuleEngine;

  private isGameStarted: boolean = false;

  private playerActionLog: PlayerAction[] = [];

  private faceCardChallenge: CardChallenge | null = null;
  private voteState: VoteState | null = null;

  constructor(io: Server, gameId: string, rules: SlapRule[] = defaultSlapRules) {
    this.io = io;
    this.gameId = gameId;

    // Default game settings
    const gameSettings: GameSettings = {
      minimumPlayers: 2,
      maximumPlayers: 8,
      slapRules: rules,
      faceCardChallengeCounts: {
        J: 1,
        Q: 2,
        K: 3,
        A: 4,
      },
      challengeCounterCards: [{ rank: '10' }],
      turnTimeout: 10000, // 10 seconds
    };
    this.ruleEngine = new RuleEngine(gameSettings);
  }

  public addPlayer(socket: Socket, playerInfo: PlayerInfo) {
    if (this.isGameStarted) {
      socket.emit(SocketEvents.ERROR, 'Game already started.');
      return;
    }

    if (this.players.length >= this.ruleEngine.getMaximumPlayers()) {
      socket.emit(SocketEvents.ERROR, 'Game is full.');
      return;
    }

    // Player name must be unique
    if (this.players.some((p) => p.name === playerInfo.name)) {
      socket.emit(SocketEvents.ERROR, 'Player name must be unique.');
      return;
    }

    // Player name must be non-empty
    if (playerInfo.name === '') {
      socket.emit(SocketEvents.ERROR, 'Player name must be non-empty.');
      return;
    }

    // All checks passed, add the player
    const player = new Player(socket, playerInfo.name);

    this.players.push(player);
    socket.join(this.gameId);

    // Notify all players that a new player has joined
    this.io.to(this.gameId).emit(SocketEvents.GAME_UPDATE, this.getGameState());
  }

  public removePlayer(socket: Socket) {
    const playerIndex = this.players.findIndex((p) => p.socket.id === socket.id);
    if (playerIndex !== -1) {
      const player = this.players.splice(playerIndex, 1)[0];

      if (this.players.length === 0) {
        // Game should be removed by GameManager
      } else {
        if (this.isGameStarted) {
          // Make sure the game is still in progress
          this.checkForWinner();
        }
        this.io.to(this.gameId).emit(SocketEvents.GAME_UPDATE, this.getGameState());
      }
    }
  }

  public hasPlayer(playerId: string): boolean {
    return this.players.some((player) => player.socket.id === playerId);
  }

  public getPlayerCount(): number {
    return this.players.length;
  }

  public performPlayerAction(action: PlayerAction) {
    if (!this.isGameStarted) {
      this.io.to(this.gameId).emit(SocketEvents.ERROR, 'Game has not started yet.');
      return;
    }

    const player = this.players.find((p) => p.socket.id === action.playerId);
    if (player) {
      this.playerActionLog.push(action);
      switch (action.actionType) {
        case PlayerActionType.PLAY_CARD:
          this.playCard(player);
          break;
        case PlayerActionType.SLAP:
          this.handleSlapAttempt(player.socket);
          break;
        case PlayerActionType.INVALID_SLAP:
          // This is a notification to the other players that the player has made an invalid slap
          break;
        default:
          console.error('Invalid action type');
      }
      this.io.to(this.gameId).emit(SocketEvents.PLAYER_ACTION_RESULT, {
        playerId: player.socket.id,
        actionType: action.actionType,
        result: 'success',
        message: 'Action performed',
      });
    }
    this.io.to(this.gameId).emit(SocketEvents.GAME_UPDATE, this.getGameState());
  }

  public getGameSettings() {
    return this.ruleEngine.getGameSettings();
  }

  public setGameSettings(settings: GameSettings) {
    // If the game is already started, return an error
    if (this.isGameStarted) {
      return;
    }
    this.ruleEngine.setGameSettings(settings);
  }

  private startGame() {
    this.isGameStarted = true;
    const deck = Deck.createShuffledDeck();
    Deck.dealCards(deck, this.players);

    this.io.to(this.gameId).emit(SocketEvents.GAME_UPDATE, this.getGameState());

    this.nextTurn();
  }

  private nextTurn() {
    if (this.players.length === 0) return;

    this.turnIndex = this.turnIndex % this.players.length;
    const currentPlayer = this.players[this.turnIndex];
    this.io.to(this.gameId).emit(SocketEvents.GAME_UPDATE, this.getGameState());

    // TODO: Implement turn timeout, for now just keep the turn alive
    // const turnTimeLimit = this.ruleEngine.getTurnTimeLimit();
    // const turnTimeout = setTimeout(() => {
    //   this.io.to(this.gameId).emit(SocketEvents.PLAYER_TIMEOUT, currentPlayer.socket.id);
    //   this.advanceTurn();
    // }, turnTimeLimit);
  }

  public handlePlayCard(socket: Socket) {
    const player = this.getPlayerBySocket(socket);
    if (player && player.socket.id === socket.id && this.players[this.turnIndex].socket.id === socket.id) {
      this.playCard(player);
    } else {
      socket.emit(SocketEvents.ERROR, 'Not your turn.');
    }
  }

  private playCard(player: Player) {
    const card = player.playCard();
    if (card) {
      this.centralPile.push(card);

      const faceCardChallenge = this.ruleEngine.getFaceCardChallengeCount(card);
      if (faceCardChallenge > 0) {
        this.handleFaceCardChallenge(player, card, faceCardChallenge);
      } else if (this.faceCardChallenge?.active) {
        this.handleFaceCardChallengeCounter(player, card);
      } else {
        this.advanceTurn();
      }
      this.io.to(this.gameId).emit(SocketEvents.GAME_UPDATE, this.getGameState());
    } else {
      // Player is out of cards (just skip turn)
      this.advanceTurn();
      this.io.to(this.gameId).emit(SocketEvents.GAME_UPDATE, this.getGameState());
      this.checkForWinner();
    }
  }

  private handleFaceCardChallenge(challenger: Player, card: Card, challengeCount: number) {
    const challenged = this.players[(this.turnIndex + 1) % this.players.length];

    this.faceCardChallenge = {
      active: true,
      challenger: challenger.getPlayerInfo(),
      challenged: challenged.getPlayerInfo(),
      remainingCounterChances: challengeCount,
      result: null,
    };

    this.io.to(this.gameId).emit(SocketEvents.GAME_UPDATE, this.getGameState());
    this.advanceTurn();
  }

  private handleFaceCardChallengeCounter(player: Player, card: Card) {
    if (!this.faceCardChallenge) return;

    if (this.ruleEngine.isChallengeCard(card)) {
      // Counter successful, start a new challenge
      const newChallengeCount = this.ruleEngine.getFaceCardChallengeCount(card);
      this.handleFaceCardChallenge(player, card, newChallengeCount);
    } else if (this.ruleEngine.isCounterCard(card)) {
      // Counter successful, end the challenge
      this.faceCardChallenge.result = 'counter';
      this.faceCardChallenge.active = false;
      this.advanceTurn();
    } else {
      this.faceCardChallenge.remainingCounterChances--;

      if (this.faceCardChallenge.remainingCounterChances === 0) {
        const challenger = this.players.find((p) => p.name === this.faceCardChallenge?.challenger.name);
        if (challenger) {
          challenger.collectPile(this.centralPile);
          this.centralPile = [];
        }
        this.faceCardChallenge.result = 'challenger';
        this.faceCardChallenge.active = false;
        this.turnIndex = this.players.indexOf(challenger!);
        this.advanceTurn();
      } else {
        this.nextTurn();
      }
    }

    this.io.to(this.gameId).emit(SocketEvents.GAME_UPDATE, this.getGameState());
  }

  public handleSlapAttempt(socket: Socket) {
    const player = this.getPlayerBySocket(socket);
    if (player) {
      const validRules = this.ruleEngine.getValidSlapRules(this.centralPile, player);
      if (validRules.length > 0) {
        console.log(
          'Valid rules:',
          validRules.map((r) => r.name),
        );
        // Reward for correct slap based on the rule's action
        const firstRule = validRules[0];
        let target = [this.players.find((p) => p.name === firstRule.targetPlayerName)];
        console.log('Target:', target);
        console.log('Action:', firstRule.action);
        switch (firstRule.action) {
          case SlapRuleAction.TAKE_PILE:
            player.collectPile(this.centralPile);
            this.centralPile = [];
            break;
          case SlapRuleAction.DRINK_ALL:
            target = this.players.filter((p) => p.name !== player.name);
          case SlapRuleAction.SKIP:
          case SlapRuleAction.DRINK:
            this.io.to(this.gameId).emit(SocketEvents.PLAYER_ACTION_RESULT, {
              playerId: player.socket.id,
              actionType: firstRule.action,
              result: 'success',
              message: `Slap successful: ${target.map((p) => p?.name).join(', ')} ${firstRule.action}`,
            });
            break;
        }

        this.turnIndex = this.players.indexOf(player);
        this.advanceTurn();
        this.io.to(this.gameId).emit(SocketEvents.GAME_UPDATE, this.getGameState());
      } else {
        // Penalty for incorrect slap
        const penaltyCard = player.givePenaltyCard();
        if (penaltyCard) {
          this.centralPile.unshift(penaltyCard);
        }
        this.io.to(this.gameId).emit(SocketEvents.PLAYER_ACTION_RESULT, {
          playerId: player.socket.id,
          actionType: PlayerActionType.INVALID_SLAP,
          result: 'failure',
          message: 'Slap unsuccessful',
        });
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
      this.io.to(this.gameId).emit(SocketEvents.GAME_UPDATE, this.getGameState());
      // Game should be removed by GameManager
    } else if (this.players.length > 1) {
      this.advanceTurn();
    }
  }

  public getGameState(): ClientGameState {
    const { handSizes, playerNames } = this.players.reduce(
      (acc, player) => {
        acc.handSizes[player.socket.id] = player.getDeckSize();
        acc.playerNames[player.socket.id] = player.name;
        return acc;
      },
      { handSizes: {}, playerNames: {} },
    );

    return {
      name: this.gameId,
      pile: this.centralPile,
      playerIds: this.players.map((p) => p.socket.id),
      playerHandSizes: handSizes,
      playerNames: playerNames,
      currentPlayerId: this.players[this.turnIndex].socket.id,
      gameOver: this.players.length === 0,
      winner: this.players.length === 1 ? this.players[0].getPlayerInfo() : null,
      gameSettings: this.ruleEngine.getGameSettings(),
      voteState: this.voteState,
      cardChallenge: this.faceCardChallenge?.active ? this.faceCardChallenge : null,
    };
  }

  public startVote(topic: string) {
    this.voteState = {
      topic,
      votes: [],
      totalPlayers: this.players.length,
    };
    this.io.to(this.gameId).emit(SocketEvents.VOTE_UPDATE, this.voteState);
  }

  public submitVote(playerId: string, vote: boolean) {
    if (!this.voteState) return;

    const existingVoteIndex = this.voteState.votes.findIndex((v) => v.playerId === playerId);
    if (existingVoteIndex !== -1) {
      this.voteState.votes[existingVoteIndex].vote = vote;
    } else {
      this.voteState.votes.push({ playerId, vote });
    }

    this.io.to(this.gameId).emit(SocketEvents.VOTE_UPDATE, this.voteState);

    if (this.voteState.votes.length === this.voteState.totalPlayers) {
      this.resolveVote();
    }
  }

  private resolveVote() {
    if (!this.voteState) return;

    const yesVotes = this.voteState.votes.filter((v) => v.vote).length;
    const result = yesVotes > this.voteState.totalPlayers / 2;

    // Handle the result (e.g., start the game if voting to start)
    if (this.voteState.topic === 'startGame' && result) {
      this.startGame();
    }

    // Reset vote state
    this.voteState = null;
    this.io.to(this.gameId).emit(SocketEvents.VOTE_UPDATE, null);
  }
}
