import { Server, Socket } from 'socket.io';
import { Game } from './game/Game';
import { SocketEvents } from './socketEvents';
import { GameSettings, LobbyState, PlayerAction, PlayerActionType, PlayerInfo } from './types';

export class GameManager {
  private static instance: GameManager;
  private static io: Server;

  private games: Map<string, Game> = new Map();
  private playerGameMap: Map<string, string> = new Map();
  private socketPlayerMap: Map<string, PlayerInfo> = new Map();
  private lobbyPlayers: Map<string, PlayerInfo> = new Map();

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

  public setIo(io: Server): void {
    GameManager.io = io;
  }

  public joinGame(gameId: string, player: PlayerInfo, socket: Socket): void {
    if (this.isPlayerInGame(player.id)) {
      this.emitError(socket, 'Player is already in a game.');
      return;
    }

    const game = this.getOrCreateGame(gameId);
    game.addPlayer(socket, player);

    this.updatePlayerMaps(player, gameId, socket);
    this.removeFromLobby(player.id);
    this.emitLobbyUpdate();
  }

  public leaveGame(socket: Socket): void {
    const gameId = this.playerGameMap.get(socket.id);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    game.removePlayer(socket);
    this.handlePlayerLeave(socket, gameId);
    this.emitLobbyUpdate();
  }

  public addToLobby(player: PlayerInfo): void {
    this.lobbyPlayers.set(player.id, player);
  }

  public removeFromLobby(playerId: string): void {
    this.lobbyPlayers.delete(playerId);
  }

  public getLobbyPlayer(playerId: string): PlayerInfo | undefined {
    return this.lobbyPlayers.get(playerId);
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
    const player = this.lobbyPlayers.get(socketId);
    if (player) {
      player.name = playerName;
      this.lobbyPlayers.set(socketId, player);
      this.emitLobbyUpdate();
    }
  }

  public getLobbyState(): LobbyState {
    return {
      players: Array.from(this.lobbyPlayers.values()),
      games: Array.from(this.games.values()).map(this.getGameInfo),
    };
  }

  public startVote(socket: Socket, topic: string): void {
    this.performGameAction(socket, (game) => game.startVote(topic));
  }

  public submitVote(socket: Socket, vote: boolean): void {
    this.performGameAction(socket, (game) => game.submitVote(socket.id, vote));
  }

  private isPlayerInGame(playerId: string): boolean {
    return this.playerGameMap.has(playerId);
  }

  private getOrCreateGame(gameId: string): Game {
    if (!this.games.has(gameId) || gameId === '') {
      gameId = gameId || this.generateGameId();
      this.games.set(gameId, new Game(GameManager.io, gameId));
    }
    return this.games.get(gameId)!;
  }

  private updatePlayerMaps(player: PlayerInfo, gameId: string, socket: Socket): void {
    this.playerGameMap.set(player.id, gameId);
    this.socketPlayerMap.set(socket.id, player);
  }

  private handlePlayerLeave(socket: Socket, gameId: string): void {
    const player = this.socketPlayerMap.get(socket.id);
    if (player) {
      this.addToLobby(player);
    }
    this.playerGameMap.delete(socket.id);
    this.socketPlayerMap.delete(socket.id);

    if (this.games.get(gameId)?.getPlayerCount() === 0) {
      this.games.delete(gameId);
    }
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
      action(game);
    }
  }

  private getGameForSocket(socket: Socket, gameId?: string): Game | undefined {
    gameId = gameId || this.playerGameMap.get(socket.id);
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
