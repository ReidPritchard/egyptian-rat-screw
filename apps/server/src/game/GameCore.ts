import type { Messenger } from "@oer/message";
import type { Room } from "@oer/message";
import { SocketEvents } from "@oer/shared/socketEvents";
import {
  type Card,
  type ClientGameState,
  type GameAction,
  GameActionType,
  type GameSettings,
  GameStatus,
  type PlayerAction,
  PlayerActionType,
  type PlayerInfo,
  type SlapRule,
} from "@oer/shared/types";
import { newLogger } from "../logger.js";
import { GameEventLogger } from "./GameEventLogger.js";
import { GameNotifier } from "./GameNotifier.js";
import { VotingSystem } from "./VotingSystem.js";
import { Deck } from "./models/Deck.js";
import { Player } from "./models/Player.js";
import { RuleEngine } from "./rules/RuleEngine.js";
import { defaultSlapRules } from "./rules/SlapRules.js";
import { CardPlayManager } from "./services/CardPlayManager.js";
import { FaceCardService } from "./services/FaceCardService.js";
import { SlapManager } from "./services/SlappingService.js";
import { WinConditionManager } from "./services/WinConditionManager.js";

const logger = newLogger("GameCore");

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
  challengeCounterCards: [{ rank: "10" }],
  turnTimeout: 30000,
  challengeCounterSlapTimeout: 2000,
};

export class GameCore {
  public gameId: string;

  // Core game state
  private players: Player[] = [];
  private turnIndex = 0;
  private centralPile: Card[] = [];
  private status = GameStatus.PRE_GAME;
  private winner: PlayerInfo | null = null;
  private gameRoom: Room;
  private readonly settings: GameSettings;

  // Managers and subsystems
  private ruleEngine: RuleEngine;
  private cardPlayManager: CardPlayManager;
  private faceCardService: FaceCardService;
  private slapManager: SlapManager;
  private votingSystem: VotingSystem;
  private winConditionManager: WinConditionManager;
  private eventLogger: GameEventLogger;
  private notifier: GameNotifier;

  constructor(
    gameId: string,
    gameRoom: Room,
    rules: SlapRule[] = defaultSlapRules,
    initialSettings?: Partial<GameSettings>
  ) {
    this.gameId = gameId;
    this.gameRoom = gameRoom;

    this.settings = {
      ...DEFAULT_GAME_SETTINGS,
      ...initialSettings,
    };

    this.ruleEngine = new RuleEngine(this.createDefaultGameSettings(rules));

    // Initialize subsystems
    this.eventLogger = new GameEventLogger();
    this.notifier = new GameNotifier(this.gameRoom);

    this.cardPlayManager = new CardPlayManager(
      this,
      this.ruleEngine,
      this.eventLogger,
      this.notifier
    );

    this.faceCardService = new FaceCardService(
      this,
      this.ruleEngine,
      this.eventLogger,
      this.notifier
    );

    this.slapManager = new SlapManager(
      this,
      this.ruleEngine,
      this.eventLogger,
      this.notifier
    );

    this.votingSystem = new VotingSystem(this, this.eventLogger, this.notifier);

    this.winConditionManager = new WinConditionManager(
      this,
      this.eventLogger,
      this.notifier
    );
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

    if (this.status !== GameStatus.PRE_GAME) {
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
    this.eventLogger.logEvent({
      playerId: messenger.id,
      eventType: GameActionType.ADD_PLAYER,
      timestamp: Date.now(),
      data: { playerInfo },
    });

    this.notifier.emitGameUpdate(this.getGameState());

    return true;
  }

  public removePlayer(messenger: Messenger): void {
    const index = this.players.findIndex(
      (p) => p.messenger.id === messenger.id
    );
    if (index === -1) return;

    this.players.splice(index, 1);

    // Log the player removal event
    this.eventLogger.logEvent({
      playerId: messenger.id,
      eventType: GameActionType.REMOVE_PLAYER,
      timestamp: Date.now(),
      data: {},
    });

    if (this.players.length === 0) return;

    if (this.status === GameStatus.PRE_GAME) {
      this.status = GameStatus.PRE_GAME; // TODO: Handle this more gracefully
    } else if (this.status === GameStatus.PLAYING) {
      this.winConditionManager.checkForWinner();
    }

    this.notifier.emitGameUpdate(this.getGameState());
  }

  public performPlayerAction(action: PlayerAction): void {
    logger.info("Performing player action", action);

    const player = this.players.find((p) => p.messenger.id === action.playerId);
    if (!player) return;

    const { actionType, data } = action;

    switch (actionType) {
      case PlayerActionType.START_VOTE:
        data.voteTopic
          ? this.votingSystem.startVote(data.voteTopic)
          : player.messenger.emit(SocketEvents.ERROR, "Invalid vote topic.");
        break;

      case PlayerActionType.CAST_VOTE:
        typeof data.vote === "boolean"
          ? this.votingSystem.submitVote(action.playerId, data.vote)
          : player.messenger.emit(SocketEvents.ERROR, "Invalid vote.");
        break;

      case PlayerActionType.SET_READY:
        logger.info(`Setting ready status for player ${action.playerId}`);
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

  public startGame(): void {
    this.resetGameState();

    const deck = new Deck({ numDecks: 1 });
    deck.shuffle();
    deck.dealCards(this.players);

    this.status = GameStatus.PLAYING;
    this.notifier.emitGameStarted({
      gameId: this.gameId,
      players: this.players.map((player) => ({
        id: player.messenger.id,
        name: player.name,
        isBot: player.messenger.isBot,
      })),
    });

    this.advanceTurn(Math.floor(Math.random() * this.players.length));

    // Emit a game update to set the initial state
    this.notifier.emitGameUpdate(this.getGameState());
  }

  private resetGameState(): void {
    this.winner = null;
    this.centralPile = [];
    this.turnIndex = 0;

    // Reset all subsystems
    this.faceCardService.reset();
    this.votingSystem.reset();
    this.eventLogger.reset();

    for (const player of this.players) {
      player.reset();
    }
  }

  private endGame(): void {
    this.status = GameStatus.GAME_OVER;

    if (this.winner) {
      this.notifier.emitGameEnded({
        winner: this.winner,
      });
    } else {
      logger.error("Game ended without a winner being set");
    }
  }

  private setReady(playerId: string, ready: boolean): void {
    const player = this.players.find((p) => p.messenger.id === playerId);
    if (!player) return;

    player.setReady(ready);

    // Log the ready status change event
    this.eventLogger.logEvent({
      playerId,
      eventType: GameActionType.SET_READY,
      timestamp: Date.now(),
      data: { ready },
    });

    this.checkForStart();
    this.notifier.emitGameUpdate(this.getGameState());
  }

  public setCurrentPlayerId(playerId: string): void {
    this.turnIndex = this.players.findIndex((p) => p.messenger.id === playerId);
  }

  private checkForStart(): void {
    if (
      this.status === GameStatus.PRE_GAME &&
      this.players.every((p) => p.isReady())
    ) {
      this.startGame();
    }
  }

  public getGameSettings(): GameSettings {
    return { ...this.settings };
  }

  public setGameSettings(settings: GameSettings): void {
    if (this.status === GameStatus.PLAYING) {
      this.notifier.emitError("Game is already in progress.");
      return;
    }

    this.ruleEngine.setGameSettings(settings);
    this.notifier.emitSettingsChanged(this.ruleEngine.getGameSettings());

    // Log the settings change event
    this.eventLogger.logEvent({
      playerId: "", // System event
      eventType: GameActionType.SET_SETTINGS,
      timestamp: Date.now(),
      data: { settings },
    });
  }

  // Getters for managers to access game state
  public getPlayers(): Player[] {
    return this.players;
  }

  public getCurrentPlayerId(): string {
    return this.players[this.turnIndex]?.messenger.id;
  }

  public getCentralPile(): Card[] {
    return this.centralPile;
  }

  public getStatus(): GameStatus {
    return this.status;
  }

  // Getters for accessing the manager classes
  public getFaceCardService(): FaceCardService {
    return this.faceCardService;
  }

  public getCardPlayManager(): CardPlayManager {
    return this.cardPlayManager;
  }

  public getWinConditionManager(): WinConditionManager {
    return this.winConditionManager;
  }

  public getSlapManager(): SlapManager {
    return this.slapManager;
  }

  public getVotingSystem(): VotingSystem {
    return this.votingSystem;
  }

  public getEventLogger(): GameEventLogger {
    return this.eventLogger;
  }

  public getNotifier(): GameNotifier {
    return this.notifier;
  }

  public getGameState(): ClientGameState {
    return {
      gameId: this.gameId,
      status: this.status,
      players: this.players.map((player) => ({
        id: player.messenger.id,
        name: player.name,
        cardCount: player.getCardCount(),
        isBot: player.messenger.isBot,
        status: player.status,
      })),
      currentPlayerId: this.getCurrentPlayerId(),
      centralPileCount: this.centralPile.length,
      centralPile: this.centralPile.reverse(),
      faceCardChallenge: this.faceCardService.getChallengeState(),
      winner: this.winner,
      voteState: this.votingSystem.getVoteState(),
      settings: this.ruleEngine.getGameSettings(),
      eventLog: this.eventLogger.getEventLog(),
    };
  }

  // Helper methods
  private isGameFull(): boolean {
    return this.players.length >= this.ruleEngine.getMaximumPlayers();
  }

  private isValidPlayerName(name: string): boolean {
    return name !== "" && !this.players.some((p) => p.name === name);
  }

  public hasPlayer(playerId: string): boolean {
    return this.players.some((p) => p.messenger.id === playerId);
  }

  public getPlayerCount(): number {
    return this.players.length;
  }

  public advanceTurn(overrideTurnIndex?: number): void {
    if (typeof overrideTurnIndex === "number") {
      this.turnIndex = overrideTurnIndex;
    } else {
      do {
        this.turnIndex = (this.turnIndex + 1) % this.players.length;
      } while (this.players[this.turnIndex].getCardCount() === 0);
    }

    // Log the turn advance event
    this.eventLogger.logEvent({
      playerId: this.getCurrentPlayerId(),
      eventType: GameActionType.ADVANCE_TURN,
      timestamp: Date.now(),
      data: {},
    });
  }

  public getEventLog(): GameAction[] {
    return this.eventLogger.getEventLog();
  }

  public setWinner(winner: PlayerInfo): void {
    this.winner = winner;
    this.endGame();
  }
}
