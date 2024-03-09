import { debug, info } from '@oers/utils';
import { ERSGame } from '../core';
import { ERSGameSession, ERSGameSessionState } from './interfaces';
import { GameStatusPayload } from '../event';

export { ERSGameSessionState };
export type { ERSGameSession };

/**
 * A class to manage game sessions and player connections.
 * There should be one instance of this class per server.
 * @typeParam ConnType - The type of the player's connection (e.g. WebSocket).
 * @param MODE - The mode of the server (development or production).
 * @public
 */
class ERSGameManager<ConnType extends { send: (message: string) => void }> {
  gameSessions: Map<string, ERSGame>;
  playerConnections: Map<string, ConnType>;
  playerSessionMap: Map<string, string>;

  constructor(MODE: 'development' | 'production' = 'development') {
    this.gameSessions = new Map();
    this.playerConnections = new Map();
    this.playerSessionMap = new Map();

    // Add some mock data for development
    if (MODE === 'development') {
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
  createGameSession(sessionId: string, gameSession: ERSGame): void {
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
   * Generates a "GameStatusPayload" for a specific player.
   * @param playerName - The name of the player to get the state for.
   * @returns The game state for the player.
   */
  getGameState(playerName: string): GameStatusPayload {
    const sessionId = this.getPlayerSession(playerName);
    if (!sessionId) {
      throw new Error('Player not found in any session');
    }
    const gameSession = this.getGameSession(sessionId);
    if (!gameSession) {
      throw new Error('Game session not found');
    }
    // Remove the 'hand' property from each player instance
    const players = gameSession.players.map((player) => {
      return {
        name: player.name,
        status: player.status,
      };
    });
    const scores = gameSession.players.reduce(
      (scoreMap, player) => {
        scoreMap[player.name] = 0; // Assuming initial score is 0 for all players
        return scoreMap;
      },
      {} as Record<string, number>
    );
    const player = gameSession.players.find(
      (player) => player.name === playerName
    );
    const handSize = player?.hand.length ?? 0;
    const slapRules = gameSession.slapRules;
    const pile = gameSession.pile;
    const currentPlayer =
      gameSession.players[gameSession.currentPlayerIndex].name;

    return {
      type: 'game-status',
      players,
      scores,
      handSize,
      slapRules,
      pile: pile,
      currentPlayer,
    };
  }

  /**
   * Broadcasts a message to all players in a session.
   * @param sessionId - The ID of the session to broadcast to.
   * @param message - The message to broadcast.
   * @returns The game session the message was broadcast to.
   */
  broadcastToSession(sessionId: string, message: string): ERSGame | undefined {
    const gameSession = this.getGameSession(sessionId);
    if (gameSession) {
      for (let player of gameSession.players) {
        const playerConnection = this.playerConnections.get(player.name);
        if (playerConnection) {
          playerConnection.send(message);
        }
      }
    }
    return gameSession;
  }

  /**
   * Broadcasts player specific game state to each player in the session.
   * @param sessionId - The ID of the session to broadcast to.
   * @returns The game session the message was broadcast to.
   */
  broadcastGameStateToSession(sessionId: string): ERSGame | undefined {
    const gameSession = this.getGameSession(sessionId);
    if (gameSession) {
      for (let player of gameSession.players) {
        const playerConnection = this.playerConnections.get(player.name);
        if (playerConnection) {
          const gameState = this.getGameState(player.name);
          playerConnection.send(JSON.stringify(gameState));
        }
      }
    }
    return gameSession;
  }

  /**
   * Generates a unique session ID.
   * @returns A unique session ID.
   */
  generateUniqueSessionId(): string {
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
  getGameSessions(): ERSGameSession[] {
    const prettyGameSessions: ERSGameSession[] = [];
    for (let [sessionId, gameSession] of this.gameSessions) {
      prettyGameSessions.push({
        id: sessionId,
        players: gameSession.players.map((player) => player.name),
        maxPlayers: gameSession.maxPlayers,
        state: gameSession.gameActive
          ? ERSGameSessionState.InProgress
          : ERSGameSessionState.Waiting,
      });
    }
    return prettyGameSessions;
  }

  /**
   * Gets a game session by its ID.
   * @param sessionId - The ID of the game session to get.
   * @returns The game session.
   */
  getGameSession(sessionId: string): ERSGame | undefined {
    // debug("Getting game session", sessionId, this.gameSessions.keys());
    return this.gameSessions.get(sessionId);
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
   * Remove player from the game session and remove the player's connection.
   * @param playerId - The ID of the player to remove.
   * @param sessionId - The ID of the session to remove the player from.
   * @returns The game session the player was removed from.
   */
  removePlayer(playerId: string, sessionId: string): ERSGame | undefined {
    this.removePlayerFromSession(playerId);
    this.removePlayerConnection(playerId);
    return this.getGameSession(sessionId);
  }

  /**
   * Adds a player to a session.
   * @param playerId - The ID of the player.
   * @param sessionId - The ID of the session.
   */
  addPlayerToSession(playerId: string, sessionId: string): void {
    this.playerSessionMap.set(playerId, sessionId);

    const gameSession = this.getGameSession(sessionId);
    if (gameSession) {
      gameSession.addPlayer(playerId);
    }
  }

  /**
   * Removes a player from a session.
   * @param playerId - The ID of the player.
   */
  removePlayerFromSession(playerId: string): void {
    this.playerSessionMap.delete(playerId);

    const gameSession = this.getGameSession(playerId);
    if (gameSession) {
      gameSession.removePlayer(playerId);
    }
  }

  /**
   * Gets the session of a player.
   * @param playerId - The ID of the player.
   */
  getPlayerSession(playerId: string): string | undefined {
    return this.playerSessionMap.get(playerId);
  }

  /**
   * Sets the player, player connection, and player session map.
   * @param playerId - The ID of the player.
   * @param playerConnection - The player's connection.
   * @param sessionId - The ID of the session.
   * @returns The session of the player.
   */
  setPlayer(
    playerId: string,
    playerConnection: ConnType,
    sessionId: string
  ): ERSGame | undefined {
    this.addPlayerConnection(playerId, playerConnection);
    this.addPlayerToSession(playerId, sessionId);

    // Send the game state to the player (if there is one)
    const gameSession = this.getGameSession(sessionId);
    if (gameSession) {
      info('Sending game state to new player', playerId);
      const gameSessionPayload = this.getGameState(playerId);
      playerConnection.send(JSON.stringify(gameSessionPayload));

      // Broadcast the new game state to all players
      // TODO: just broadcast a "player-joined" event
      this.broadcastGameStateToSession(sessionId);
    }

    return gameSession;
  }
}

/**
 * Create a single instance of the game manager or
 * return the existing instance.
 */
let instance: ERSGameManager<any> | null = null;
export function getGameManager<
  ConnType extends { send: (message: string) => void },
>(
  MODE: 'development' | 'production' = 'development'
): ERSGameManager<ConnType> {
  if (instance === null) {
    instance = new ERSGameManager<ConnType>(MODE);
  }
  return instance as ERSGameManager<ConnType>;
}
