import { ERSGame } from "../core";
import { ERSGameSession, ERSGameSessionState } from "./interfaces";

export { ERSGameSessionState };
export type { ERSGameSession };

/**
 * A class to manage game sessions and player connections.
 * There should be one instance of this class per server.
 * @typeParam ConnType - The type of the player's connection (e.g. WebSocket).
 * @param MODE - The mode of the server (development or production).
 * @public
 */
class ERSGameManager<ConnType> {
  private gameSessions: Map<string, ERSGame>;
  private playerConnections: Map<string, ConnType>;
  private playerSessionMap: Map<string, string>;

  constructor(MODE: "development" | "production" = "development") {
    this.gameSessions = new Map();
    this.playerConnections = new Map();
    this.playerSessionMap = new Map();

    // Add some mock data for development
    if (MODE === "development") {
      this.createSession();
      this.createSession();
      this.createSession();
    }
  }

  /**
   * Creates a new game session.
   * @param sessionId - The ID of the session.
   * @param gameSession - The game session to add.
   */
  private createGameSession(sessionId: string, gameSession: ERSGame): void {
    this.gameSessions.set(sessionId, gameSession);
  }

  /**
   * Creates a new game session with a unique session ID.
   * @returns The unique session ID.
   */
  createSession(): string {
    const sessionId = this.generateUniqueSessionId();
    this.createGameSession(sessionId, new ERSGame([]));
    return sessionId;
  }

  /**
   * Generates a unique session ID.
   * @returns A unique session ID.
   */
  private generateUniqueSessionId(): string {
    let sessionId;
    do {
      sessionId = Math.random().toString(36).substring(7);
    } while (this.gameSessions.has(sessionId));
    return sessionId;
  }

  /**
   * Removes a game session.
   * @param sessionId - The ID of the session to remove.
   */
  removeGameSession(sessionId: string): void {
    this.gameSessions.delete(sessionId);
  }

  /**
   * Gets all game sessions.
   * @returns A map of game session IDs to game session Names
   */
  getGameSessions(): Map<string, ERSGameSession> {
    const prettyGameSessions = new Map<string, ERSGameSession>();
    for (let [sessionId, gameSession] of this.gameSessions) {
      prettyGameSessions.set(sessionId, {
        players: gameSession.players.map(
          (player: { name: any }) => player.name
        ),
        state: gameSession.gameActive
          ? ERSGameSessionState.InProgress
          : ERSGameSessionState.Waiting,
        id: sessionId,
      });
    }
    return prettyGameSessions;
  }

  /**
   * Adds a player connection.
   * @param playerId - The ID of the player.
   * @param playerConnection - The player's connection.
   */
  addPlayerConnection(playerId: string, playerConnection: ConnType): void {
    this.playerConnections.set(playerId, playerConnection);
  }

  /**
   * Removes a player connection.
   * @param playerId - The ID of the player whose connection to remove.
   */
  removePlayerConnection(playerId: string): void {
    this.playerConnections.delete(playerId);
  }

  /**
   * Adds a player to a session.
   * @param playerId - The ID of the player.
   * @param sessionId - The ID of the session.
   */
  addPlayerToSession(playerId: string, sessionId: string): void {
    this.playerSessionMap.set(playerId, sessionId);
  }

  /**
   * Removes a player from a session.
   * @param playerId - The ID of the player.
   */
  removePlayerFromSession(playerId: string): void {
    this.playerSessionMap.delete(playerId);
  }

  /**
   * Gets the session of a player.
   * @param playerId - The ID of the player.
   */
  getPlayerSession(playerId: string): string | undefined {
    return this.playerSessionMap.get(playerId);
  }
}

/**
 * Create a single instance of the game manager or
 * return the existing instance.
 */
let instance: ERSGameManager<any> | null = null;
export function getGameManager<ConnType>(
  MODE: "development" | "production" = "development"
): ERSGameManager<ConnType> {
  if (instance === null || MODE === "development") {
    instance = new ERSGameManager<ConnType>(MODE);
  }
  return instance as ERSGameManager<ConnType>;
}
