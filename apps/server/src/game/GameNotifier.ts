import type { Room } from "@oer/message";
import {
  type GameEndedPayload,
  type GameStartedPayload,
  SocketEvents,
} from "@oer/shared/socketEvents";
import type { ClientGameState, GameSettings } from "@oer/shared/types";
import { newLogger } from "../logger.js";

const logger = newLogger("GameNotifier");

/**
 * Handles all socket communication between the game and clients
 */
export class GameNotifier {
  private gameRoom: Room;

  constructor(gameRoom: Room) {
    this.gameRoom = gameRoom;
  }

  /**
   * Emit a game state update to all players
   */
  public emitGameUpdate(gameState: ClientGameState): void {
    logger.debug("Emitting game state update");
    this.gameRoom.emit(SocketEvents.GAME_STATE_UPDATED, gameState);
  }

  /**
   * Emit a game started event
   */
  public emitGameStarted(payload: GameStartedPayload): void {
    logger.info(`Game started: ${payload.gameId}`);
    this.gameRoom.emit(SocketEvents.GAME_STARTED, payload);
  }

  /**
   * Emit a game ended event
   */
  public emitGameEnded(payload: GameEndedPayload): void {
    logger.info(`Game ended, winner: ${payload.winner.name}`);
    this.gameRoom.emit(SocketEvents.GAME_ENDED, payload);
  }

  /**
   * Emit an error message
   */
  public emitError(message: string): void {
    logger.error(`Error: ${message}`);
    this.gameRoom.emit(SocketEvents.ERROR, message);
  }

  /**
   * Emit settings changed event
   */
  public emitSettingsChanged(settings: GameSettings): void {
    logger.debug("Game settings updated");
    this.gameRoom.emit(SocketEvents.SET_GAME_SETTINGS, settings);
  }

  /**
   * Emit a vote resolved event
   */
  public emitVoteResolved(
    topic: string,
    voteCount: { yes: number; no: number },
    passed: boolean
  ): void {
    logger.info(`Vote resolved: ${topic}, passed: ${passed}`);
    this.gameRoom.emit(SocketEvents.VOTE_RESOLVED, {
      topic,
      voteCount,
      passed,
    });
  }
}
