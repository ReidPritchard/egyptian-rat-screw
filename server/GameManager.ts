import { Server, Socket } from 'socket.io';
import { LOBBY_ROOM } from './config';
import { Game } from './game/Game';
import { SocketEvents } from './socketEvents';
import { GameSettings, LobbyState, PlayerAction, PlayerActionType, PlayerInfo } from './types';

export class GameManager {
  private static instance: GameManager;
  private static io: Server;

  /**
   * Stores all active games, indexed by their game ID.
   */
  private games: Map<string, Game> = new Map();

  /**
   * Maps socket IDs to the corresponding player information.
   */
  private socketPlayerMap: Map<string, PlayerInfo> = new Map();

  private constructor(io: Server) {
    GameManager.io = io;
  }

  public static getInstance(io?: Server): GameManager {
    if (!GameManager.instance) {
      if (!io) throw new Error('IO instance required for initial GameManager creation');
      GameManager.instance = new GameManager(io);
    }
    return GameManager.instance;
  }

  public joinGame(gameId: string, player: PlayerInfo, socket: Socket): void {
    if (this.isPlayerInGame(socket)) {
      this.emitError(socket, 'Player is already in a game.');
      return;
    }

    const game = this.getOrCreateGame(gameId);

    // Join the game and leave the lobby
    // This is done before adding the player to the game
    // so that the game update is emitted to the new player too
    socket.leave(LOBBY_ROOM);
    socket.join(game.gameId);

    game.addPlayer(socket, player);

    this.socketPlayerMap.set(socket.id, player);

    this.emitLobbyUpdate();
  }

  public leaveGame(socket: Socket): void {
    // socket.rooms is a Set, it will always contain the socket's identifier
    // but we want to find any game id
    const gameId = Array.from(socket.rooms).find((room) => room !== socket.id && this.games.has(room));

    if (!gameId) {
      this.emitError(socket, 'Player is not in a game.');
      return;
    }

    const game = this.games.get(gameId);
    if (!game) {
      this.emitError(socket, 'Game does not exist.');
      return;
    }

    game.removePlayer(socket);

    socket.leave(gameId);
    socket.join(LOBBY_ROOM);

    // If the game is empty, remove it
    if (game.getPlayerCount() === 0) {
      this.games.delete(gameId);
    }

    this.emitLobbyUpdate();
  }

  public initPlayerInLobby(player: PlayerInfo, socket: Socket): void {
    socket.join(LOBBY_ROOM);
    this.socketPlayerMap.set(socket.id, player);
    this.emitLobbyUpdate();
  }

  public getLobbyPlayer(playerId: string): PlayerInfo | undefined {
    return this.socketPlayerMap.get(playerId);
  }

  public handleDisconnect(socket: Socket): void {
    // Call this in socket io "disconnecting" event in order to access the socket's rooms

    // Make sure the player is removed from any games they are in
    // also remove them from the lobby
    socket.rooms.forEach((room, isLobby) => {
      console.log('Removing player from game', room, isLobby);
      const game = this.games.get(room);
      if (game) {
        game.removePlayer(socket);
      }
      socket.leave(room);
    });

    this.socketPlayerMap.delete(socket.id);

    this.emitLobbyUpdate();
  }

  public handlePlayCard(socket: Socket): void {
    this.performGameAction(socket, (game) => game.handlePlayCard(socket));
  }

  public performPlayerAction(socket: Socket, actionType: PlayerActionType): void {
    this.performGameAction(socket, (game) => {
      const action: PlayerAction = { playerId: socket.id, actionType, timestamp: Date.now() };
      game.performPlayerAction(action);
    });
  }

  public getGameSettings(socket: Socket, gameId?: string): void {
    const game = this.getGameForSocket(socket, gameId);
    if (game) {
      socket.emit(SocketEvents.GET_GAME_SETTINGS, game.getGameSettings());
    }
  }

  public setGameSettings(socket: Socket, gameId: string | undefined, settings: GameSettings): void {
    const game = this.getGameForSocket(socket, gameId);
    if (game) {
      game.setGameSettings(settings);
    }
  }

  public setPlayerName(socketId: string, playerName: string): void {
    const player = this.getLobbyPlayer(socketId);
    if (player) {
      player.name = playerName;
      this.socketPlayerMap.set(socketId, player);
      this.emitLobbyUpdate();
    }
  }

  public getLobbyState(): LobbyState {
    // Get all player ids in the lobby room
    const playerIdsInLobby = Array.from(GameManager.io.sockets.adapter.rooms.get(LOBBY_ROOM) || []);
    const playersInLobby = playerIdsInLobby
      .map((playerId) => this.getLobbyPlayer(playerId as string))
      .filter((player) => player !== undefined)
      .map((player) => ({ id: player.id, name: player.name || 'Anonymous' }));
    return {
      players: playersInLobby,
      games: Array.from(this.games.values()).map(this.getGameInfo),
    };
  }

  public startVote(socket: Socket, topic: string): void {
    this.performGameAction(socket, (game) => {
      console.log('Starting vote on game', game.gameId);
      game.startVote(topic);
    });
  }

  public submitVote(socket: Socket, vote: boolean): void {
    this.performGameAction(socket, (game) => game.submitVote(socket.id, vote));
  }

  private isPlayerInGame(socket: Socket): boolean {
    return Array.from(socket.rooms).some((room) => this.games.has(room));
  }

  private getOrCreateGame(gameId: string): Game {
    if (!this.games.has(gameId) || gameId === '') {
      gameId = gameId || this.generateGameId();
      this.games.set(gameId, new Game(GameManager.io, gameId));
    }
    return this.games.get(gameId)!;
  }

  private emitLobbyUpdate(): void {
    GameManager.io.emit(SocketEvents.LOBBY_UPDATE, this.getLobbyState());
  }

  private emitError(socket: Socket, message: string): void {
    socket.emit(SocketEvents.ERROR, message);
  }

  private performGameAction(socket: Socket, action: (game: Game) => void): void {
    const game = this.getGameForSocket(socket);
    if (game) {
      console.log('Performing game action on game', game.gameId);
      action(game);
    }
  }

  private getGameForSocket(socket: Socket, gameId?: string): Game | undefined {
    gameId = gameId || Array.from(socket.rooms).find((room) => room !== socket.id && this.games.has(room));
    if (!gameId) {
      this.emitError(socket, 'Player is not in a game.');
      return;
    }
    return this.games.get(gameId);
  }

  private generateGameId(): string {
    // Generate a random human-readable game ID
    const nouns = ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew', 'kiwi', 'lemon'];
    const adjectives = ['quick', 'lazy', 'sleepy', 'noisy', 'hungry', 'thirsty', 'silly', 'serious', 'cool', 'hot'];
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}`;
  }

  private getGameInfo(game: Game) {
    return {
      id: game.gameId,
      name: game.gameId,
      playerCount: game.getPlayerCount(),
      maxPlayers: game.getGameSettings().maximumPlayers,
    };
  }
}
