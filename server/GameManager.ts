import { Server, Socket } from 'socket.io';
import { SETTINGS } from './config.js';
import { Game } from './game/Game.js';
import { newLogger } from './logger.js';
import { SocketEvents } from './socketEvents.js';
import { GameSettings, PlayerAction, PlayerActionType, PlayerInfo } from './types.js';

const logger = newLogger('GameManager');

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

    logger.info('Getting or creating game', gameId);
    const game = this.getOrCreateGame(gameId);

    logger.info('Game stage before joining', game.getStage());
    logger.info('Current player count', game.getPlayerCount());

    socket.leave(SETTINGS.LOBBY_ROOM);
    socket.join(game.gameId);

    logger.info('Player removed from lobby and joined game', game.gameId);

    const playerAdditionResult = game.addPlayer(socket, player);

    this.socketPlayerMap.set(socket.id, player);

    if (playerAdditionResult) {
      logger.info('Player successfully added to game', player.name);
      this.emitPlayerLeftLobby(socket.id, player.name);
    } else {
      logger.error('Player addition failed', playerAdditionResult);
      this.initPlayerInLobby(player, socket);
    }
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

    socket.leave(gameId); // Remove player from game
    socket.join(SETTINGS.LOBBY_ROOM); // Add player to lobby

    // Emit player joined lobby event
    this.initPlayerInLobby(this.socketPlayerMap.get(socket.id)!, socket);

    // If the game is empty, remove it
    if (game.getPlayerCount() === 0) {
      this.games.delete(gameId);
    }
  }

  public initPlayerInLobby(player: PlayerInfo, socket: Socket): void {
    socket.join(SETTINGS.LOBBY_ROOM);
    this.socketPlayerMap.set(socket.id, player);

    // Emit player joined lobby event
    this.emitPlayerJoinedLobby(socket.id, player.name);

    // Emit all lobby players to the new player
    this.socketPlayerMap.forEach((player) => {
      if (player.id !== socket.id) {
        GameManager.io.to(socket.id).emit(SocketEvents.PLAYER_JOINED_LOBBY, player);
      }
    });
  }

  public getLobbyPlayer(playerId: string): PlayerInfo | undefined {
    return this.socketPlayerMap.get(playerId);
  }

  public handleDisconnect(socket: Socket): void {
    // Call this in socket io "disconnecting" event in order to access the socket's rooms

    // Make sure the player is removed from any games they are in
    // also remove them from the lobby
    socket.rooms.forEach((room, isLobby) => {
      logger.info('Removing player from game', room, isLobby);
      const game = this.games.get(room);
      if (game) {
        game.removePlayer(socket);
      }
      socket.leave(room);
    });

    // Emit player left lobby event
    this.emitPlayerLeftLobby(socket.id, this.socketPlayerMap.get(socket.id)?.name);

    this.socketPlayerMap.delete(socket.id);
  }

  public handlePlayCard(socket: Socket): void {
    logger.info('Routing play card to game', socket.id);
    this.performGameAction(socket, (game) => game.handlePlayCard(socket));
  }

  public handleSlapPile(socket: Socket): void {
    this.performGameAction(socket, (game) => game.handleSlapAttempt(socket));
  }

  public handlePlayerReady(socket: Socket): void {
    this.performGameAction(socket, (game) =>
      game.performPlayerAction({
        actionType: PlayerActionType.SET_READY,
        playerId: socket.id,
        timestamp: Date.now(),
        data: {
          ready: true,
        },
      }),
    );
  }

  public performPlayerAction(socket: Socket, action: PlayerAction): void {
    this.performGameAction(socket, (game) => {
      game.performPlayerAction(action);
    });
  }

  public getGameSettings(socket: Socket, gameId?: string): void {
    const game = this.getGameForSocket(socket, gameId);
    if (game) {
      socket.emit(SocketEvents.SET_GAME_SETTINGS, game.getGameSettings());
    }
  }

  public setGameSettings(socket: Socket, gameId: string | undefined, settings: GameSettings): void {
    const game = this.getGameForSocket(socket, gameId);
    if (game) {
      game.setGameSettings(settings);
    }
  }

  public setPlayerName(socketId: string, playerName: string): void {
    logger.info('Setting player name', socketId, playerName);
    const player = this.getLobbyPlayer(socketId);
    if (player) {
      player.name = playerName;
      this.socketPlayerMap.set(socketId, player);

      GameManager.io.to(SETTINGS.LOBBY_ROOM).emit(SocketEvents.PLAYER_NAME_CHANGED, {
        id: socketId,
        name: playerName,
      });
    }
  }

  public startVote(socket: Socket, topic: string): void {
    this.performGameAction(socket, (game) => {
      logger.info('Starting vote on game', game.gameId);
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
    logger.info('Getting or creating game', gameId);
    if (!this.games.has(gameId) || gameId === '') {
      logger.info('Generating new game', gameId);
      gameId = gameId || this.generateGameId();
      this.games.set(gameId, new Game(GameManager.io, gameId));
    }
    logger.info('Game', gameId, this.games.get(gameId));
    return this.games.get(gameId)!;
  }

  private emitPlayerLeftLobby(id: string, name: string | undefined): void {
    if (!name) {
      name = this.generatePlayerName();
      this.setPlayerName(id, name);
    }

    logger.info('Emitting player left lobby', id, name);

    GameManager.io.to(SETTINGS.LOBBY_ROOM).emit(SocketEvents.PLAYER_LEFT_LOBBY, {
      id,
      name,
    });
  }

  private emitPlayerJoinedLobby(id: string, name: string): void {
    GameManager.io.to(SETTINGS.LOBBY_ROOM).emit(SocketEvents.PLAYER_JOINED_LOBBY, {
      id,
      name,
    });
  }

  private emitError(socket: Socket, message: string): void {
    socket.emit(SocketEvents.ERROR, message);
  }

  private performGameAction(socket: Socket, action: (game: Game) => void): void {
    const game = this.getGameForSocket(socket);
    if (game) {
      logger.info('Performing game action on game', game.gameId);
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
    const nouns = SETTINGS.GENERATORS.GAME_ID.NOUNS;
    const adjectives = SETTINGS.GENERATORS.GAME_ID.ADJECTIVES;
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}`;
  }

  private generatePlayerName(): string {
    const adjectives = SETTINGS.GENERATORS.PLAYER_NAME.ADJECTIVES;
    const names = SETTINGS.GENERATORS.PLAYER_NAME.NOUNS;
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
  }
}
