import type { GameEvent } from "@oer/shared/types";
import { newLogger } from "../logger.js";

const logger = newLogger("GameEventLogger");

/**
 * Handles logging and tracking of all game events
 */
export class GameEventLogger {
  private eventLog: GameEvent[] = [];

  constructor() {
    this.reset();
  }

  /**
   * Log a new game event
   */
  public logEvent(event: GameEvent): void {
    logger.debug(`Logging event: ${event.eventType}`);
    this.eventLog.push(event);
  }

  /**
   * Get the complete event log
   */
  public getEventLog(): GameEvent[] {
    return [...this.eventLog];
  }

  /**
   * Clear the event log
   */
  public reset(): void {
    this.eventLog = [];
  }
}
