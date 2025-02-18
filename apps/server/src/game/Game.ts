import type { WebSocketServer } from "ws";
import { SETTINGS } from "@oer/configuration";
import { newLogger } from "../logger.js";
import {
  type GameEndedPayload,
  type GameStartedPayload,
  SocketEvents,
  type VoteCount,
} from "../socketEvents.js";
import {
  type Card,
  type ClientGameState,
  type GameEvent,
  GameEventType,
  type GameSettings,
  GameStage,
  type PlayerAction,
  PlayerActionType,
  type PlayerInfo,
  type SlapRule,
  type Vote,
  type VoteState,
} from "../types.js";
import { Deck } from "./Deck.js";
import { FaceCardChallenge } from "./FaceCardChallenge.js";
import { Player } from "./Player.js";
import { RuleEngine } from "./rules/RuleEngine.js";
import { defaultSlapRules } from "./rules/SlapRules.js";
import type { Messenger } from "@oer/message";
import type { Room } from "@oer/message";

const logger = newLogger("Game");

const DEFAULT_GAME_SETTINGS: GameSettings = {
  minimumPlayers: 2,
  maximumPlayers: 4,
  slapRules: [],
  faceCardChallengeCounts: {
    J: 1,
    Q: 2,
    K: 3,
    A: 4,
  },
  challengeCounterCards: [],
  turnTimeout: 30000,
  challengeCounterSlapTimeout: 2000,
};

export class Game {
  public gameId: string;

  private players: Player[] = [];
  private turnIndex = 0;
  private centralPile: Card[] = [];
  private stage = GameStage.PRE_GAME;

  private faceCardChallenge: FaceCardChallenge | null = null;

  private ruleEngine: RuleEngine;

  private winner: PlayerInfo | null = null;

  private voteState: VoteState | null = null;
  private gameEventLog: GameEvent[] = [];

  private gameRoom: Room;

  private readonly settings: GameSettings;

  constructor(
    gameId: string,
    gameRoom: Room,
    rules: SlapRule[] = defaultSlapRules,
    initialSettings?: Partial<GameSettings>
  ) {
    this.gameId = gameId;
    this.ruleEngine = new RuleEngine(this.createDefaultGameSettings(rules));
    this.settings = {
      ...DEFAULT_GAME_SETTINGS,
      ...initialSettings,
    };
    this.gameRoom = gameRoom;
  }

  private createDefaultGameSettings(rules: SlapRule[]): GameSettings {
    return {
      minimumPlayers: 2,
      maximumPlayers: 8,
      slapRules: rules,
      faceCardChallengeCounts: { J: 1, Q: 2, K: 3, A: 4 },
      challengeCounterCards: [{ rank: "10" }],
      turnTimeout: 10000,
      challengeCounterSlapTimeout: 5000,
    };
  }

  public addPlayer(messenger: Messenger, playerInfo: PlayerInfo): boolean {
    logger.info(`Adding player to game: ${playerInfo.name}`);

    if (this.stage !== GameStage.PRE_GAME) {
      messenger.emit(SocketEvents.ERROR, "Game has already started.");
      return false;
    }

    if (this.isGameFull()) {
      messenger.emit(SocketEvents.ERROR, "Game is full.");
      return false;
    }

    if (!this.isValidPlayerName(playerInfo.name)) {
      messenger.emit(SocketEvents.ERROR, "Invalid player name.");
      return false;
    }

    logger.info(`Player ${playerInfo.name} added to game: ${this.gameId}`);

    const player = new Player(messenger, playerInfo.name);
    this.players.push(player);

    // Log the player addition event
    this.logEvent({
      playerId: messenger.id,
      eventType: GameEventType.ADD_PLAYER,
      timestamp: Date.now(),
      data: { playerInfo },
    });

    this.emitGameUpdate();

    return true;
  }

  private isGameFull(): boolean {
    return this.players.length >= this.ruleEngine.getMaximumPlayers();
  }

  private isValidPlayerName(name: string): boolean {
    return name !== "" && !this.players.some((p) => p.name === name);
  }

  public removePlayer(messenger: Messenger): void {
    const index = this.players.findIndex(
      (p) => p.messenger.id === messenger.id
    );
    if (index === -1) return;

    this.players.splice(index, 1);

    // Log the player removal event
    this.logEvent({
      playerId: messenger.id,
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
    return this.players.some((p) => p.messenger.id === playerId);
  }

  public getPlayerCount(): number {
    return this.players.length;
  }

  public performPlayerAction(action: PlayerAction): void {
    const player = this.players.find((p) => p.messenger.id === action.playerId);
    if (!player) return;

    const { actionType, data } = action;

    switch (actionType) {
      case PlayerActionType.START_VOTE:
        data.voteTopic
          ? this.startVote(data.voteTopic)
          : player.messenger.emit(SocketEvents.ERROR, "Invalid vote topic.");
        break;

      case PlayerActionType.CAST_VOTE:
        typeof data.vote === "boolean"
          ? this.submitVote(action.playerId, data.vote)
          : player.messenger.emit(SocketEvents.ERROR, "Invalid vote.");
        break;

      case PlayerActionType.SET_READY:
        typeof data.ready === "boolean"
          ? this.setReady(action.playerId, data.ready)
          : player.messenger.emit(SocketEvents.ERROR, "Invalid ready status.");
        break;

      case PlayerActionType.SET_SETTINGS:
        data.settings
          ? this.setGameSettings(data.settings)
          : player.messenger.emit(SocketEvents.ERROR, "Invalid settings.");
        break;

      default:
        logger.error("Invalid action type");
    }
  }

  public getGameSettings(): GameSettings {
    return { ...this.settings };
  }

  public setGameSettings(settings: GameSettings): void {
    if (this.stage === GameStage.PLAYING) {
      this.emitError("Game is already in progress.");
      return;
    }

    this.ruleEngine.setGameSettings(settings);
    this.emitSettingsChanged();

    // Log the settings change event
    this.logEvent({
      playerId: "", // System event
      eventType: GameEventType.SET_SETTINGS,
      timestamp: Date.now(),
      data: { settings },
    });
  }

  private checkForStart(): void {
    if (
      this.stage === GameStage.PRE_GAME &&
      this.players.every((p) => p.isReady())
    ) {
      this.startGame();
    }
  }

  private startGame(): void {
    this.resetGameState();

    const deck = new Deck({ numDecks: 1 });
    deck.shuffle();
    deck.dealCards(this.players);

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
    this.gameEventLog = [];

    for (const player of this.players) {
      player.reset();
    }
  }

  private endGame(): void {
    this.stage = GameStage.GAME_OVER;
    this.emitGameEnded();
  }

  public handlePlayCard(messenger: Messenger): void {
    const player = this.getPlayerByMessenger(messenger);
    if (player) {
      this.playCard(player);
    }
  }

  private playCard(player: Player): void {
    if (this.stage !== GameStage.PLAYING) {
      player.messenger.emit(SocketEvents.ERROR, "Game is not in progress.");
      return;
    }

    if (player !== this.players[this.turnIndex]) {
      player.messenger.emit(SocketEvents.ERROR, "Not your turn.");
      return;
    }

    const card = player.playCard();
    if (!card) {
      player.messenger.emit(SocketEvents.ERROR, "No cards to play.");
      return;
    }

    this.centralPile.push(card);

    // Log the play card event
    this.logEvent({
      playerId: player.messenger.id,
      eventType: GameEventType.PLAY_CARD,
      timestamp: Date.now(),
      data: { card },
    });

    // Check if the played card is a face card
    const challengeCount = this.ruleEngine.getFaceCardChallengeCount(card);
    if (challengeCount > 0) {
      this.startFaceCardChallenge(player, challengeCount);
    } else {
      this.advanceTurn();
    }

    this.emitGameUpdate();
  }

  private getNextPlayerId(): string {
    const nextIndex = (this.turnIndex + 1) % this.players.length;
    return this.players[nextIndex].messenger.id;
  }

  private startFaceCardChallenge(
    challenger: Player,
    challengeCount: number
  ): void {
    const challengerInfo: PlayerInfo = {
      id: challenger.messenger.id,
      name: challenger.name,
      isBot: challenger.messenger.isBot,
    };

    this.faceCardChallenge = new FaceCardChallenge(
      challengerInfo,
      challengeCount,
      this.getNextPlayerId()
    );

    // Log the face card challenge start event
    this.logEvent({
      playerId: challenger.messenger.id,
      eventType: GameEventType.START_CHALLENGE,
      timestamp: Date.now(),
      data: {},
    });

    this.emitGameUpdate();
  }

  private handleFaceCardChallengeCounter(player: Player, card: Card): void {
    if (!this.faceCardChallenge) return;

    const isCounterCard = this.ruleEngine.isCounterCard(card);
    const challengeCount = this.ruleEngine.getFaceCardChallengeCount(card);

    if (isCounterCard || challengeCount > 0) {
      // Counter successful - next player must respond
      const playerInfo: PlayerInfo = {
        id: player.messenger.id,
        name: player.name,
        isBot: player.messenger.isBot,
      };

      this.faceCardChallenge.updateCounter(
        playerInfo,
        challengeCount,
        this.getNextPlayerId()
      );

      // Log the face card challenge counter event
      this.logEvent({
        playerId: player.messenger.id,
        eventType: GameEventType.COUNTER_FACE_CARD_CHALLENGE,
        timestamp: Date.now(),
        data: { card },
      });
    } else {
      const isComplete = this.faceCardChallenge.decrementPlays(
        this.getNextPlayerId()
      );

      if (isComplete) {
        // Challenge completed successfully
        const challenger = this.players.find(
          (p) => p.messenger.id === this.faceCardChallenge?.getChallenger().id
        );
        if (challenger) {
          challenger.addCards(this.centralPile);
          this.centralPile = [];

          // Log the face card challenge success event
          this.logEvent({
            playerId: challenger.messenger.id,
            eventType: GameEventType.WIN_FACE_CARD_CHALLENGE,
            timestamp: Date.now(),
            data: {},
          });
        }
        this.faceCardChallenge = null;
        this.advanceTurn();
      }
    }
  }

  private resolveFaceCardChallengeFailure(player: Player): void {
    if (!this.faceCardChallenge) return;

    // Failed to counter - challenger wins
    const challenger = this.players.find(
      (p) => p.messenger.id === this.faceCardChallenge?.getChallenger().id
    );
    if (challenger) {
      challenger.addCards(this.centralPile);
      this.centralPile = [];

      // Log the face card challenge failure event
      this.logEvent({
        playerId: player.messenger.id,
        eventType: GameEventType.LOSE_FACE_CARD_CHALLENGE,
        timestamp: Date.now(),
        data: {},
      });
    }

    this.faceCardChallenge = null;
    this.advanceTurn();
  }

  public handleSlapAttempt(messenger: Messenger): void {
    const player = this.getPlayerByMessenger(messenger);
    if (!player) return;

    const timestamp = Date.now();
    const validSlap = this.ruleEngine.checkSlap(this.centralPile, player);

    if (validSlap) {
      this.processValidSlap(player, validSlap, timestamp);
    } else {
      this.processInvalidSlap(player, timestamp);
    }
  }

  private processValidSlap(
    player: Player,
    rule: SlapRule,
    timestamp: number
  ): void {
    // Award cards to the player
    player.addCards(this.centralPile);
    this.centralPile = [];

    // Reset any ongoing face card challenge
    this.faceCardChallenge = null;

    // Log the successful slap event
    this.logEvent({
      playerId: player.messenger.id,
      eventType: GameEventType.VALID_SLAP,
      timestamp,
      data: { rule },
    });

    // Check if this player has won
    this.checkForWinner();

    // If no winner, continue with the next player
    if (!this.winner) {
      this.advanceTurn();
    }

    this.emitGameUpdate();
  }

  private processInvalidSlap(player: Player, timestamp: number): void {
    // Burn a card for invalid slap
    const burnedCard = player.playCard();
    if (burnedCard) {
      this.centralPile.push(burnedCard);

      // Log the invalid slap event
      this.logEvent({
        playerId: player.messenger.id,
        eventType: GameEventType.INVALID_SLAP,
        timestamp,
        data: { burnedCard },
      });

      this.emitGameUpdate();
    }
  }

  private advanceTurn(overrideTurnIndex?: number): void {
    if (typeof overrideTurnIndex === "number") {
      this.turnIndex = overrideTurnIndex;
    } else {
      do {
        this.turnIndex = (this.turnIndex + 1) % this.players.length;
      } while (this.players[this.turnIndex].getCardCount() === 0);
    }

    // Log the turn advance event
    this.logEvent({
      playerId: this.getCurrentPlayerId(),
      eventType: GameEventType.ADVANCE_TURN,
      timestamp: Date.now(),
      data: {},
    });
  }

  private getPlayerByMessenger(messenger: Messenger): Player | undefined {
    return this.players.find((p) => p.messenger.id === messenger.id);
  }

  private checkForWinner(): void {
    const activePlayers = this.players.filter((p) => p.getCardCount() > 0);

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      this.winner = {
        id: winner.messenger.id,
        name: winner.name,
        isBot: winner.messenger.isBot,
      };

      // Log the game end event
      this.logEvent({
        playerId: winner.messenger.id,
        eventType: GameEventType.END_GAME,
        timestamp: Date.now(),
        data: { winner: this.winner },
      });

      this.endGame();
    }
  }

  public getGameState(): ClientGameState {
    return {
      gameId: this.gameId,
      stage: this.stage,
      players: this.players.map((player) => ({
        id: player.messenger.id,
        name: player.name,
        cardCount: player.getCardCount(),
        isBot: player.messenger.isBot,
        isReady: player.isReady(),
      })),
      currentPlayerId: this.getCurrentPlayerId(),
      centralPileCount: this.centralPile.length,
      topCards: this.centralPile.slice(-3).reverse(),
      faceCardChallenge: this.faceCardChallenge
        ? {
            challenger: this.faceCardChallenge.getChallenger(),
            currentPlayerId: this.faceCardChallenge.getCurrentPlayerId(),
            remainingPlays: this.faceCardChallenge.getRemainingPlays(),
          }
        : null,
      winner: this.winner,
      voteState: this.voteState,
      settings: this.ruleEngine.getGameSettings(),
      eventLog: this.gameEventLog,
    };
  }

  private getCurrentPlayerId(): string {
    return this.players[this.turnIndex]?.messenger.id;
  }

  private emitSettingsChanged(): void {
    this.gameRoom.emit(SocketEvents.SET_GAME_SETTINGS, {
      ...this.ruleEngine.getGameSettings(),
    });
  }

  private emitGameStarted(): void {
    const payload: GameStartedPayload = {
      gameId: this.gameId,
      players: this.players.map((player) => ({
        id: player.messenger.id,
        name: player.name,
        isBot: player.messenger.isBot,
      })),
    };
    this.gameRoom.emit(SocketEvents.GAME_STARTED, payload);
  }

  private emitGameEnded(): void {
    if (!this.winner) return;

    const payload: GameEndedPayload = {
      winner: this.winner,
    };
    this.gameRoom.emit(SocketEvents.GAME_ENDED, payload);
  }

  private emitGameUpdate(): void {
    this.gameRoom.emit(SocketEvents.GAME_STATE_UPDATED, this.getGameState());
  }

  private emitError(message: string): void {
    this.gameRoom.emit(SocketEvents.ERROR, message);
  }

  private setReady(playerId: string, ready: boolean): void {
    const player = this.players.find((p) => p.messenger.id === playerId);
    if (!player) return;

    player.setReady(ready);

    // Log the ready status change event
    this.logEvent({
      playerId,
      eventType: GameEventType.SET_READY,
      timestamp: Date.now(),
      data: { ready },
    });

    this.checkForStart();
    this.emitGameUpdate();
  }

  public startVote(topic: string): void {
    if (this.voteState) {
      this.emitError("A vote is already in progress.");
      return;
    }

    this.voteState = {
      topic,
      votes: [],
      startTime: Date.now(),
    };

    // Log the vote start event
    this.logEvent({
      playerId: "", // System event
      eventType: GameEventType.START_VOTE,
      timestamp: Date.now(),
      data: { topic },
    });

    this.emitGameUpdate();
  }

  public submitVote(playerId: string, vote: boolean): void {
    if (!this.voteState) {
      this.emitError("No vote in progress.");
      return;
    }

    this.voteState.votes.push({ playerId, vote });

    // Log the vote submission event
    this.logEvent({
      playerId,
      eventType: GameEventType.SUBMIT_VOTE,
      timestamp: Date.now(),
      data: { vote },
    });

    // Check if all players have voted
    if (this.voteState.votes.length === this.players.length) {
      this.resolveVote();
    }

    this.emitGameUpdate();
  }

  private resolveVote(): void {
    if (!this.voteState) return;

    const voteCount: VoteCount = {
      yes: 0,
      no: 0,
    };

    for (const vote of this.voteState.votes) {
      vote.vote ? voteCount.yes++ : voteCount.no++;
    }

    const passed = voteCount.yes > voteCount.no;

    // Log the vote resolution event
    this.logEvent({
      playerId: "", // System event
      eventType: GameEventType.RESOLVE_VOTE,
      timestamp: Date.now(),
      data: { voteCount, passed },
    });

    this.gameRoom.emit(SocketEvents.VOTE_RESOLVED, {
      topic: this.voteState.topic,
      voteCount,
      passed,
    });

    this.voteState = null;
    this.emitGameUpdate();
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
