import { Server, Socket } from 'socket.io';
import { newLogger } from '../logger';
import { GameEndedPayload, GameStartedPayload, SocketEvents, VoteCount } from '../socketEvents';
import {
  Card,
  CardChallenge,
  ClientGameState,
  GameEvent,
  GameEventType,
  GameSettings,
  GameStage,
  PlayerAction,
  PlayerActionType,
  PlayerInfo,
  SlapRule,
  SlapRuleAction,
  VoteState,
} from '../types';
import { Deck } from './Deck';
import { Player } from './Player';
import { RuleEngine } from './rules/RuleEngine';
import { defaultSlapRules } from './rules/SlapRules';

const logger = newLogger('Game');

export class Game {
  public gameId: string;

  private io: Server;

  private players: Player[] = [];
  private turnIndex = 0;
  private centralPile: Card[] = [];
  private stage = GameStage.PRE_GAME;

  private faceCardChallenge: CardChallenge | null = null;
  private ruleEngine: RuleEngine;

  private winner: PlayerInfo | null = null;

  private voteState: VoteState | null = null;
  private gameEventLog: GameEvent[] = [];

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
      turnTimeout: 10000,
      challengeCounterSlapTimeout: 5000,
    };
  }

  public addPlayer(socket: Socket, playerInfo: PlayerInfo): boolean {
    logger.info('Adding player to game', playerInfo.name);

    if (this.stage !== GameStage.PRE_GAME) {
      this.emitErrorToSocket(socket, 'Game has already started.');
      return false;
    }

    if (this.isGameFull()) {
      this.emitErrorToSocket(socket, 'Game is full.');
      return false;
    }

    if (!this.isValidPlayerName(playerInfo.name)) {
      this.emitErrorToSocket(socket, 'Invalid player name.');
      return false;
    }

    const player = new Player(socket, playerInfo.name);
    this.players.push(player);
    this.emitGameUpdate();

    // Log the player addition event
    this.logEvent({
      playerId: socket.id,
      eventType: GameEventType.ADD_PLAYER,
      timestamp: Date.now(),
      data: { playerInfo },
    });

    return true;
  }

  private isGameFull(): boolean {
    return this.players.length >= this.ruleEngine.getMaximumPlayers();
  }

  private isValidPlayerName(name: string): boolean {
    return name !== '' && !this.players.some((p) => p.name === name);
  }

  public removePlayer(socket: Socket): void {
    const index = this.players.findIndex((p) => p.socket.id === socket.id);
    if (index === -1) return;

    this.players.splice(index, 1);

    // Log the player removal event
    this.logEvent({
      playerId: socket.id,
      eventType: GameEventType.REMOVE_PLAYER,
      timestamp: Date.now(),
      data: {},
    });

    if (this.players.length === 0) return;

    if (this.stage === GameStage.PRE_GAME) {
      this.stage = GameStage.CANCELLED;
    } else if (this.stage === GameStage.PLAYING) {
      this.checkForWinner();
    }

    this.emitGameUpdate();
  }

  public hasPlayer(playerId: string): boolean {
    return this.players.some((p) => p.socket.id === playerId);
  }

  public getPlayerCount(): number {
    return this.players.length;
  }

  public performPlayerAction(action: PlayerAction): void {
    const player = this.players.find((p) => p.socket.id === action.playerId);
    if (!player) return;

    const { actionType, data } = action;

    switch (actionType) {
      case PlayerActionType.START_VOTE:
        data.voteTopic ? this.startVote(data.voteTopic) : this.emitErrorToSocket(player.socket, 'Invalid vote topic.');
        break;

      case PlayerActionType.CAST_VOTE:
        typeof data.vote === 'boolean'
          ? this.submitVote(action.playerId, data.vote)
          : this.emitErrorToSocket(player.socket, 'Invalid vote.');
        break;

      case PlayerActionType.SET_READY:
        typeof data.ready === 'boolean'
          ? this.setReady(action.playerId, data.ready)
          : this.emitErrorToSocket(player.socket, 'Invalid ready status.');
        break;

      case PlayerActionType.SET_SETTINGS:
        data.settings
          ? this.setGameSettings(data.settings)
          : this.emitErrorToSocket(player.socket, 'Invalid settings.');
        break;

      default:
        logger.error('Invalid action type');
    }
  }

  public getGameSettings(): GameSettings {
    return this.ruleEngine.getGameSettings();
  }

  public setGameSettings(settings: GameSettings): void {
    if (this.stage === GameStage.PLAYING) {
      this.emitError('Game is already in progress.');
      return;
    }

    this.ruleEngine.setGameSettings(settings);
    this.emitSettingsChanged();

    // Log the settings change event
    this.logEvent({
      playerId: '', // System event
      eventType: GameEventType.SET_SETTINGS,
      timestamp: Date.now(),
      data: { settings },
    });
  }

  private checkForStart(): void {
    if (this.stage === GameStage.PRE_GAME && this.players.every((p) => p.isReady())) {
      this.startGame();
    }
  }

  private startGame(): void {
    this.resetGameState();

    const deck = Deck.createShuffledDeck();
    Deck.dealCards(deck, this.players);

    this.stage = GameStage.PLAYING;
    this.emitGameStarted();

    this.advanceTurn(Math.floor(Math.random() * this.players.length));

    // Emit a game update to set the initial state
    this.emitGameUpdate();
  }

  private resetGameState(): void {
    this.winner = null;
    this.faceCardChallenge = null;
    this.voteState = null;
    this.centralPile = [];
    this.turnIndex = 0;
    this.players.forEach((player) => player.reset());
    this.gameEventLog = [];
  }

  private endGame(): void {
    this.stage = GameStage.PRE_GAME;
    this.emitGameUpdate();
  }

  public handlePlayCard(socket: Socket): void {
    const player = this.getPlayerBySocket(socket);

    if (player && this.players[this.turnIndex].socket.id === socket.id) {
      this.playCard(player);
    } else {
      this.emitErrorToSocket(socket, 'Not your turn.');
    }
  }

  private playCard(player: Player): void {
    const card = player.playCard();
    const timestamp = Date.now();

    if (!card) {
      this.logEvent({
        playerId: player.socket.id,
        eventType: GameEventType.PLAY_CARD,
        timestamp,
        data: { card: null, message: 'No card to play' },
      });
      this.advanceTurn();
      this.checkForWinner();
      return;
    }

    this.centralPile.push(card);
    this.io.to(this.gameId).emit(SocketEvents.CARD_PLAYED, { playerId: player.socket.id, card });

    this.logEvent({
      playerId: player.socket.id,
      eventType: GameEventType.PLAY_CARD,
      timestamp,
      data: { card },
    });

    const challengeCount = this.ruleEngine.getFaceCardChallengeCount(card);

    if (challengeCount > 0) {
      this.startFaceCardChallenge(player, challengeCount);
    } else if (this.faceCardChallenge?.active) {
      this.handleFaceCardChallengeCounter(player, card);
    } else {
      this.advanceTurn();
    }
  }

  private startFaceCardChallenge(challenger: Player, challengeCount: number): void {
    const challengedIndex = (this.turnIndex + 1) % this.players.length;
    const challenged = this.players[challengedIndex];

    this.faceCardChallenge = {
      active: true,
      challenger: challenger.getPlayerInfo(),
      challenged: challenged.getPlayerInfo(),
      remainingCounterChances: challengeCount,
      result: null,
    };

    this.io.to(this.gameId).emit(SocketEvents.CHALLENGE_STARTED, {
      challengerId: challenger.socket.id,
      challengedId: challenged.socket.id,
      remainingCounterChances: challengeCount,
    });

    // Log the challenge start event
    this.logEvent({
      playerId: challenger.socket.id,
      eventType: GameEventType.START_CHALLENGE,
      timestamp: Date.now(),
      data: {
        challengedId: challenged.socket.id,
        remainingCounterChances: challengeCount,
      },
    });

    this.advanceTurn(challengedIndex);
  }

  private handleFaceCardChallengeCounter(player: Player, card: Card): void {
    if (!this.faceCardChallenge) return;

    const timestamp = Date.now();

    if (this.ruleEngine.isCounterCard(card)) {
      this.faceCardChallenge.result = 'counter';
      this.faceCardChallenge.active = false;
      this.io.to(this.gameId).emit(SocketEvents.CHALLENGE_RESULT, {
        winnerId: player.socket.id,
        loserId: this.faceCardChallenge.challenger.id,
        message: `${player.name} has survived the card challenge!`,
      });

      // Log the challenge counter event
      this.logEvent({
        playerId: player.socket.id,
        eventType: GameEventType.COUNTER_CHALLENGE,
        timestamp,
        data: { card },
      });

      this.advanceTurn();
    } else {
      this.faceCardChallenge.remainingCounterChances--;

      // Log the failed counter attempt
      this.logEvent({
        playerId: player.socket.id,
        eventType: GameEventType.FAILED_COUNTER,
        timestamp,
        data: { card },
      });

      if (this.faceCardChallenge.remainingCounterChances === 0) {
        this.resolveFaceCardChallengeFailure(player);
      } else {
        this.advanceTurn();
      }
    }
  }

  private resolveFaceCardChallengeFailure(player: Player): void {
    if (!this.faceCardChallenge) return;

    const challenger = this.players.find((p) => p.socket.id === this.faceCardChallenge?.challenger.id);
    if (!challenger) return;

    challenger.collectPile(this.centralPile);
    this.centralPile = [];

    this.io.to(this.gameId).emit(SocketEvents.CHALLENGE_RESULT, {
      winnerId: challenger.socket.id,
      loserId: player.socket.id,
      message: `${challenger.name} has won the challenge and taken the pile!`,
    });

    // Log the challenge failure event
    this.logEvent({
      playerId: player.socket.id,
      eventType: GameEventType.CHALLENGE_FAILED,
      timestamp: Date.now(),
      data: { winnerId: challenger.socket.id },
    });

    this.faceCardChallenge.result = 'challenger';
    this.faceCardChallenge.active = false;
    this.turnIndex = this.players.indexOf(challenger) - 1;
    this.advanceTurn();
  }

  public handleSlapAttempt(socket: Socket): void {
    const player = this.getPlayerBySocket(socket);
    if (!player) return;

    const timestamp = Date.now();
    const validRules = this.ruleEngine.getValidSlapRules(this.centralPile, player);

    if (validRules.length > 0) {
      this.processValidSlap(player, validRules[0], timestamp);
    } else {
      this.processInvalidSlap(player, timestamp);
    }
  }

  private processValidSlap(player: Player, rule: SlapRule, timestamp: number): void {
    if (rule.action === SlapRuleAction.TAKE_PILE) {
      player.collectPile(this.centralPile);
      this.centralPile = [];
      this.faceCardChallenge = null;
    }

    this.io.to(this.gameId).emit(SocketEvents.SLAP_RESULT, {
      playerId: player.socket.id,
      result: 'valid',
      message: `Slap successful: ${player.name} ${rule.action}`,
    });

    this.io.to(this.gameId).emit(SocketEvents.GAME_PILE_UPDATED, this.centralPile);

    // Log the valid slap event
    this.logEvent({
      playerId: player.socket.id,
      eventType: GameEventType.SLAP,
      timestamp,
      data: { result: 'valid', rule: rule.name },
    });

    this.turnIndex = this.players.indexOf(player) - 1;
    this.advanceTurn();
  }

  private processInvalidSlap(player: Player, timestamp: number): void {
    const penaltyCard = player.givePenaltyCard();
    if (penaltyCard) {
      this.centralPile.unshift(penaltyCard);
    }

    this.io.to(this.gameId).emit(SocketEvents.SLAP_RESULT, {
      playerId: player.socket.id,
      result: 'invalid',
      message: 'Slap unsuccessful',
    });

    this.io.to(this.gameId).emit(SocketEvents.GAME_PILE_UPDATED, this.centralPile);

    // Log the invalid slap event
    this.logEvent({
      playerId: player.socket.id,
      eventType: GameEventType.SLAP,
      timestamp,
      data: { result: 'invalid' },
    });
  }

  private advanceTurn(overrideTurnIndex?: number): void {
    this.turnIndex = overrideTurnIndex ?? (this.turnIndex + 1) % this.players.length;
    this.io.to(this.gameId).emit(SocketEvents.TURN_CHANGED, {
      currentPlayerId: this.getCurrentPlayerId(),
    });

    // Log the turn change event
    this.logEvent({
      playerId: '', // System event
      eventType: GameEventType.TURN_CHANGED,
      timestamp: Date.now(),
      data: { currentPlayerId: this.getCurrentPlayerId() },
    });
  }

  private getPlayerBySocket(socket: Socket): Player | undefined {
    return this.players.find((p) => p.socket.id === socket.id);
  }

  private checkForWinner(): void {
    if (this.stage !== GameStage.PLAYING) return;

    const totalCards = this.players.reduce((sum, p) => sum + p.getDeckSize(), 0) + this.centralPile.length;

    if (totalCards === 0) return;

    for (const player of this.players) {
      if (player.getDeckSize() === totalCards) {
        this.stage = GameStage.GAME_OVER;
        this.winner = player.getPlayerInfo();
        this.emitGameEnded();

        // Log the game end event
        this.logEvent({
          playerId: player.socket.id,
          eventType: GameEventType.GAME_ENDED,
          timestamp: Date.now(),
          data: { winner: this.winner },
        });

        return;
      }
    }
  }

  public getGameState(): ClientGameState {
    const playerData = this.players.reduce<{
      handSizes: Record<string, number>;
      playerNames: Record<string, string>;
      playerReadyStatus: Record<string, boolean>;
    }>(
      (acc, player) => {
        acc.handSizes[player.socket.id] = player.getDeckSize();
        acc.playerNames[player.socket.id] = player.name;
        acc.playerReadyStatus[player.socket.id] = player.isReady();
        return acc;
      },
      {
        handSizes: {},
        playerNames: {},
        playerReadyStatus: {},
      },
    );

    return {
      name: this.gameId,
      stage: this.stage,
      pileCards: this.centralPile,
      playerIds: this.players.map((p) => p.socket.id),
      playerHandSizes: playerData.handSizes,
      playerNames: playerData.playerNames,
      playerReadyStatus: playerData.playerReadyStatus,
      currentPlayerId: this.getCurrentPlayerId(),
      winner: this.winner,
      gameSettings: this.ruleEngine.getGameSettings(),
      voteState: this.voteState,
      cardChallenge: this.faceCardChallenge?.active ? this.faceCardChallenge : null,
    };
  }

  private getCurrentPlayerId(): string {
    return this.players[this.turnIndex]?.socket.id ?? '';
  }

  private emitSettingsChanged(): void {
    this.io.to(this.gameId).emit(SocketEvents.GAME_SETTINGS_CHANGED, this.ruleEngine.getGameSettings());
  }

  private emitGameStarted(): void {
    const payload: GameStartedPayload = {
      startTime: Date.now(),
    };
    this.io.to(this.gameId).emit(SocketEvents.GAME_STARTED, payload);

    // Log the game start event
    this.logEvent({
      playerId: '', // System event
      eventType: GameEventType.GAME_STARTED,
      timestamp: Date.now(),
      data: { startTime: payload.startTime },
    });
  }

  private emitGameEnded(): void {
    const payload: GameEndedPayload = {
      winner: this.winner,
    };
    this.io.to(this.gameId).emit(SocketEvents.GAME_ENDED, payload);
  }

  private emitGameUpdate(): void {
    this.io.to(this.gameId).emit(SocketEvents.GAME_STATE_UPDATED, this.getGameState());
  }

  private emitErrorToSocket(socket: Socket, message: string): void {
    socket.emit(SocketEvents.ERROR, message);
  }

  private emitError(message: string): void {
    this.io.to(this.gameId).emit(SocketEvents.ERROR, message);
  }

  private setReady(playerId: string, ready: boolean): void {
    const player = this.players.find((p) => p.socket.id === playerId);
    if (!player) return;

    player.setReady(ready);

    const event = ready ? SocketEvents.PLAYER_READY : SocketEvents.PLAYER_NOT_READY;

    this.io.to(this.gameId).emit(event, player.getPlayerInfo());

    // Log the readiness change event
    this.logEvent({
      playerId: player.socket.id,
      eventType: GameEventType.SET_READY,
      timestamp: Date.now(),
      data: { ready },
    });

    this.checkForStart();
  }

  public startVote(topic: string): void {
    if (this.stage === GameStage.VOTING) {
      logger.info('Vote already in progress');
      return;
    }

    this.voteState = {
      topic,
      votes: [],
      totalPlayers: this.players.length,
    };
    this.io.to(this.gameId).emit(SocketEvents.VOTE_STARTED, this.voteState);

    // Log the vote start event
    this.logEvent({
      playerId: '', // System event
      eventType: GameEventType.START_VOTE,
      timestamp: Date.now(),
      data: { topic },
    });
  }

  public submitVote(playerId: string, vote: boolean): void {
    if (!this.voteState) return;

    const existingVote = this.voteState.votes.find((v) => v.playerId === playerId);

    if (existingVote) {
      existingVote.vote = vote;
    } else {
      this.voteState.votes.push({ playerId, vote });
    }

    this.io.to(this.gameId).emit(SocketEvents.VOTE_UPDATED, this.voteState);

    // Log the vote submission event
    this.logEvent({
      playerId,
      eventType: GameEventType.CAST_VOTE,
      timestamp: Date.now(),
      data: { vote },
    });

    if (this.voteState.votes.length === this.voteState.totalPlayers) {
      this.resolveVote();
    }
  }

  private resolveVote(): void {
    if (!this.voteState) return;

    const yesVotes = this.voteState.votes.filter((v) => v.vote).length;
    const result = yesVotes > this.voteState.totalPlayers / 2;

    if (this.voteState.topic === 'startGame' && result) {
      this.startGame();
    } else if (this.voteState.topic === 'endGame' && result) {
      this.endGame();
    }

    const voteCount: VoteCount = {
      yes: yesVotes,
      no: this.voteState.totalPlayers - yesVotes,
    };

    this.io.to(this.gameId).emit(SocketEvents.VOTE_ENDED, {
      voteResult: result,
      voteCount,
    });

    // Log the vote resolution event
    this.logEvent({
      playerId: '', // System event
      eventType: GameEventType.VOTE_RESOLVED,
      timestamp: Date.now(),
      data: { result, voteCount },
    });

    this.voteState = null;
  }

  public getStage(): GameStage {
    return this.stage;
  }

  private logEvent(event: GameEvent): void {
    this.gameEventLog.push(event);
  }

  public getEventLog(): GameEvent[] {
    return this.gameEventLog;
  }
}
