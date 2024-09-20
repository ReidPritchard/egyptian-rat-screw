import { Server, Socket } from 'socket.io';
import { Game } from './game/Game';
import { SocketEvents } from './socketEvents';
import { GameSettings, LobbyState, PlayerAction, PlayerActionType, PlayerInfo } from './types';
import { Player } from './game/Player';

export class GameManager {
  private static instance: GameManager;
  private static io: Server;

  // Map of gameId to Game
  private games: Map<string, Game> = new Map();
  // Map of playerId to gameId
  private playerGameMap: Map<string, string> = new Map();
  // Map of socketId to PlayerInfo
  private socketPlayerMap: Map<string, PlayerInfo> = new Map();
  // Map of playerId to PlayerInfo for players in the lobby
  private lobbyPlayers: Map<string, PlayerInfo> = new Map();

  private constructor(io: Server) {
    GameManager.io = io;
  }

  public setIo(io: Server) {
    GameManager.io = io;
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager(GameManager.io);
    }
    return GameManager.instance;
  }

  public joinGame(gameId: string, player: PlayerInfo, socket: Socket) {
    // If the player is already in a game, return an error
    if (this.playerGameMap.has(player.id)) {
      socket.emit(SocketEvents.ERROR, 'Player is already in a game.');
      return;
    }

    // If the game doesn't exist, create it
    if (!this.games.has(gameId) || gameId === '') {
      gameId = gameId || Math.random().toString();
      this.games.set(gameId, new Game(GameManager.io, gameId, []));
    }

    // Try to add the player to the game
    // The game will handle if it's full or already started
    this.games.get(gameId)?.addPlayer(socket, player);

    // Update the player's game id
    this.playerGameMap.set(player.id, gameId);
    this.socketPlayerMap.set(socket.id, player);
    this.removeFromLobby(player.id);
    // Update all clients to sync the game list
    GameManager.io.emit(SocketEvents.LOBBY_UPDATE, this.getLobbyState());
  }

  public leaveGame(socket: Socket) {
    const gameId = this.playerGameMap.get(socket.id);
    if (gameId) {
      this.games.get(gameId)?.removePlayer(socket);
      const player = this.socketPlayerMap.get(socket.id);
      if (player) {
        this.addToLobby(player);
      }
      this.playerGameMap.delete(socket.id);
      this.socketPlayerMap.delete(socket.id);

      // If the game is empty, remove it
      if (this.games.get(gameId)?.getPlayerCount() === 0) {
        this.games.delete(gameId);
      }

      // Update all clients to sync the game list
      GameManager.io.emit(SocketEvents.LOBBY_UPDATE, this.getLobbyState());
    }
  }

  public addToLobby(player: PlayerInfo) {
    this.lobbyPlayers.set(player.id, player);
  }

  public removeFromLobby(playerId: string) {
    this.lobbyPlayers.delete(playerId);
  }

  public getLobbyPlayer(playerId: string): PlayerInfo | undefined {
    return this.lobbyPlayers.get(playerId);
  }

  public performPlayerAction(socket: Socket, actionType: PlayerActionType) {
    const gameId = this.playerGameMap.get(socket.id);
    if (gameId) {
      const action: PlayerAction = {
        playerId: socket.id,
        actionType: actionType,
        timestamp: Date.now(),
      };
      this.games.get(gameId)?.performPlayerAction(action);
    }
  }

  public getGameSettings(socket: Socket, gameId?: string) {
    // if no game id is provided, return the settings for the game the player is in
    if (!gameId) {
      gameId = this.playerGameMap.get(socket.id);
    }
    if (!gameId) {
      socket.emit(SocketEvents.ERROR, 'Player is not in a game.');
      return;
    }
    const game = this.games.get(gameId);
    if (game) {
      socket.emit(SocketEvents.GET_GAME_SETTINGS, game.getGameSettings());
    }
  }

  public setGameSettings(socket: Socket, gameId: string | undefined, settings: GameSettings) {
    // if no game id is provided, set the settings for the game the player is in
    if (!gameId) {
      gameId = this.playerGameMap.get(socket.id);
    }
    if (!gameId) {
      socket.emit(SocketEvents.ERROR, 'Player is not in a game.');
      return;
    }
    const game = this.games.get(gameId);
    if (game) {
      game.setGameSettings(settings);
    }
  }

  public setPlayerName(socketId: string, playerName: string) {
    const player = this.lobbyPlayers.get(socketId);
    if (player) {
      player.name = playerName;
      this.lobbyPlayers.set(socketId, player);
      // Update lobby state after name change
      GameManager.io.emit(SocketEvents.LOBBY_UPDATE, this.getLobbyState());
    }
  }

  // Update getLobbyState to include lobbyPlayers
  public getLobbyState(): LobbyState {
    return {
      players: Array.from(this.lobbyPlayers.values()),
      games: Array.from(this.games.values()).map((game) => ({
        id: game.gameId,
        name: game.gameId,
        playerCount: game.getPlayerCount(),
        maxPlayers: game.getGameSettings().maximumPlayers,
      })),
    };
  }
}
