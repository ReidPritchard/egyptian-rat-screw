import type { Messenger } from "@oer/message";
import type { Room } from "@oer/message";
import type {
  ClientGameState,
  GameSettings,
  GameStage,
  PlayerAction,
  PlayerInfo,
  SlapRule,
} from "@oer/shared/types";
import { newLogger } from "../logger.js";
import { GameCore } from "./GameCore.js";
import { defaultSlapRules } from "./rules/SlapRules.js";

const logger = newLogger("Game");

/**
 * Main game class that serves as the public API for the Egyptian Ratscrew game
 * Delegates most functionality to the specialized manager classes
 */
export class Game {
  private gameCore: GameCore;

  constructor(
    gameId: string,
    gameRoom: Room,
    rules: SlapRule[] = defaultSlapRules,
    initialSettings?: Partial<GameSettings>
  ) {
    this.gameCore = new GameCore(gameId, gameRoom, rules, initialSettings);
  }

  public get gameId(): string {
    return this.gameCore.gameId;
  }

  // Player management

  public addPlayer(messenger: Messenger, playerInfo: PlayerInfo): boolean {
    return this.gameCore.addPlayer(messenger, playerInfo);
  }

  public removePlayer(messenger: Messenger): void {
    this.gameCore.removePlayer(messenger);
  }

  public hasPlayer(playerId: string): boolean {
    return this.gameCore.hasPlayer(playerId);
  }

  public getPlayerCount(): number {
    return this.gameCore.getPlayerCount();
  }

  // Actions and game state

  public performPlayerAction(action: PlayerAction): void {
    this.gameCore.performPlayerAction(action);
  }

  public handlePlayCard(messenger: Messenger): void {
    try {
      // Use the public method to access the CardPlayManager
      this.gameCore.getCardPlayManager().handlePlayCard(messenger);
    } catch (error) {
      logger.error("Error handling play card action", error);
    }
  }

  public handleSlapAttempt(messenger: Messenger): void {
    this.gameCore.getSlapManager().handleSlapAttempt(messenger);
  }

  public getGameState(): ClientGameState {
    return this.gameCore.getGameState();
  }

  public getGameSettings(): GameSettings {
    return this.gameCore.getGameSettings();
  }

  public setGameSettings(settings: GameSettings): void {
    this.gameCore.setGameSettings(settings);
  }

  // Utility methods

  public startVote(topic: string): void {
    this.gameCore.getVotingSystem().startVote(topic);
  }

  public submitVote(playerId: string, vote: boolean): void {
    this.gameCore.getVotingSystem().submitVote(playerId, vote);
  }

  public getStage(): GameStage {
    return this.gameCore.getStage();
  }
}
