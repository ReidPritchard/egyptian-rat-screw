import { Server, Socket } from 'socket.io';
import { Player } from './Player';
import { Deck } from './Deck';
import { RuleEngine } from './rules/RuleEngine';
import {
  PlayerInfo,
  SlapRule,
  Card,
  ClientGameState,
  PlayerAction,
  PlayerActionType,
  GameSettings,
  SlapRuleAction,
  VoteState,
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
    this.ruleEngine = new RuleEngine(this.createDefaultGameSettings(rules));
  }

  private createDefaultGameSettings(rules: SlapRule[]): GameSettings {
    return {
      minimumPlayers: 2,
      maximumPlayers: 8,
      slapRules: rules,
      faceCardChallengeCounts: { J: 1, Q: 2, K: 3, A: 4 },
      challengeCounterCards: [{ rank: '10' }],
      turnTimeout: 10000, // 10 seconds
    };
  }

  public addPlayer(socket: Socket, playerInfo: PlayerInfo) {
    if (this.isGameStarted || this.isGameFull() || !this.isValidPlayerName(playerInfo.name)) {
      this.emitErrorToSocket(socket, this.getPlayerAdditionErrorMessage(playerInfo.name));
      return;
    }

    const player = new Player(socket, playerInfo.name);
    this.players.push(player);
    this.emitGameUpdate();
  }

  private isGameFull(): boolean {
    return this.players.length >= this.ruleEngine.getMaximumPlayers();
  }

  private isValidPlayerName(name: string): boolean {
    return name !== '' && !this.players.some((p) => p.name === name);
  }

  private getPlayerAdditionErrorMessage(playerName: string): string {
    if (this.isGameStarted) return 'Game already started.';
    if (this.isGameFull()) return 'Game is full.';
    if (this.players.some((p) => p.name === playerName)) return 'Player name must be unique.';
    if (playerName === '') return 'Player name must be non-empty.';
    return 'Unable to add player.';
  }

  public removePlayer(socket: Socket) {
    const playerIndex = this.players.findIndex((p) => p.socket.id === socket.id);
    if (playerIndex !== -1) {
      console.log('Removing player', socket.id);
      this.players.splice(playerIndex, 1);
      console.log('Players left', this.players.length);

      if (this.players.length > 0) {
        if (this.isGameStarted) {
          this.checkForWinner();
        }
        this.emitGameUpdate();
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
        timestamp: Date.now(),
      });
    }
    this.emitGameUpdate();
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

    this.emitGameUpdate();

    this.nextTurn();
  }

  private nextTurn() {
    if (this.players.length === 0) return;

    this.turnIndex = this.turnIndex % this.players.length;
    this.emitGameUpdate();

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

      const faceCardChallengeCount = this.ruleEngine.getFaceCardChallengeCount(card);
      if (faceCardChallengeCount > 0) {
        this.handleFaceCardChallenge(player, card, faceCardChallengeCount);
      } else if (this.faceCardChallenge?.active) {
        this.handleFaceCardChallengeCounter(player, card);
      } else {
        this.advanceTurn();
      }
      this.emitGameUpdate();
    } else {
      // Player is out of cards (just skip turn)
      this.advanceTurn();
      this.emitGameUpdate();
      this.checkForWinner();
    }
  }

  private handleFaceCardChallenge(challenger: Player, card: Card, challengeCount: number) {
    const challenged = this.players[(this.turnIndex + 1) % this.players.length];

    this.io.to(this.gameId).emit(SocketEvents.PLAYER_ACTION, {
      playerId: challenger.socket.id,
      actionType: PlayerActionType.FACE_CARD_CHALLENGE,
      message: `${challenger.name} has challenged ${challenged.name} with a ${card.rank}`,
    });

    this.faceCardChallenge = {
      active: true,
      challenger: challenger.getPlayerInfo(),
      challenged: challenged.getPlayerInfo(),
      remainingCounterChances: challengeCount,
      result: null,
    };

    this.emitGameUpdate();
    this.advanceTurn();
  }

  private handleFaceCardChallengeCounter(player: Player, card: Card) {
    if (!this.faceCardChallenge) return;

    if (this.ruleEngine.isCounterCard(card)) {
      // Counter successful, end the challenge
      this.faceCardChallenge.result = 'counter';
      this.faceCardChallenge.active = false;
      this.io.to(this.gameId).emit(SocketEvents.PLAYER_ACTION_RESULT, {
        playerId: player.socket.id,
        actionType: PlayerActionType.CHALLENGE_COUNTER_COMPLETE,
        result: 'success',
        message: `${player.name} has survived the card challenge!`,
      });
      this.advanceTurn();
    } else {
      this.faceCardChallenge.remainingCounterChances--;

      if (this.faceCardChallenge.remainingCounterChances === 0) {
        // Challenger wins
        const challenger = this.players.find((p) => p.name === this.faceCardChallenge?.challenger.name);
        if (challenger) {
          challenger.collectPile(this.centralPile);
          this.centralPile = [];

          this.io.to(this.gameId).emit(SocketEvents.PLAYER_ACTION_RESULT, {
            playerId: player.socket.id,
            actionType: PlayerActionType.CHALLENGE_COUNTER_COMPLETE,
            result: 'success',
            message: `${challenger.name} has won their challenge and has taken the pile!`,
          });
        }
        this.faceCardChallenge.result = 'challenger';
        this.faceCardChallenge.active = false;
        // The challenger (who just won) goes next
        this.turnIndex = this.players.indexOf(challenger!);
      }

      this.nextTurn();
    }

    this.emitGameUpdate();
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
        this.emitGameUpdate();
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
      this.emitGameUpdate();
      // Game should be removed by GameManager
    } else if (this.players.length > 1) {
      this.advanceTurn();
    }
  }

  public getGameState(): ClientGameState {
    const playerData = this.getPlayerData();
    return {
      name: this.gameId,
      pile: this.centralPile,
      playerIds: this.players.map((p) => p.socket.id),
      playerHandSizes: playerData.handSizes,
      playerNames: playerData.playerNames,
      currentPlayerId: this.getCurrentPlayerId(),
      gameOver: this.players.length === 0,
      winner: this.getWinner(),
      gameSettings: this.ruleEngine.getGameSettings(),
      voteState: this.voteState,
      cardChallenge: this.getActiveCardChallenge(),
    };
  }

  private getPlayerData() {
    return this.players.reduce(
      (acc, player) => {
        acc.handSizes[player.socket.id] = player.getDeckSize();
        acc.playerNames[player.socket.id] = player.name;
        return acc;
      },
      { handSizes: {}, playerNames: {} } as { handSizes: Record<string, number>; playerNames: Record<string, string> },
    );
  }

  private getCurrentPlayerId(): string {
    return this.players[this.turnIndex]?.socket.id ?? '';
  }

  private getWinner(): PlayerInfo | null {
    return this.players.length === 1 ? this.players[0].getPlayerInfo() : null;
  }

  private getActiveCardChallenge(): CardChallenge | null {
    return this.faceCardChallenge?.active ? this.faceCardChallenge : null;
  }

  private emitGameUpdate() {
    console.log(
      'Players',
      this.players.map((p) => p.name),
      this.io.sockets.adapter.rooms,
    );
    console.log('Emitting game update', this.gameId);
    this.io.to(this.gameId).emit(SocketEvents.GAME_UPDATE, this.getGameState());
  }

  private emitErrorToSocket(socket: Socket, message: string) {
    socket.emit(SocketEvents.ERROR, message);
  }

  public startVote(topic: string) {
    console.log('Starting vote', topic);
    if (this.voteState) {
      console.log('Vote already in progress');
      return;
    }

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
