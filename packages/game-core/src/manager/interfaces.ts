/**
 * Enum for game session states.
 */
export enum ERSGameSessionState {
  Waiting = "waiting",
  InProgress = "in-progress",
  Ended = "ended",
}

/**
 * Interface for a game session containing only the information needed for the client.
 */
export interface ERSGameSession {
  /**
   * Unique identifier for the game session.
   */
  id: string;

  /**
   * Array of player identifiers participating in the game session.
   */
  players: string[];

  /**
   * Current state of the game session.
   */
  state: ERSGameSessionState;
}
