import type { Server, Socket } from "socket.io";
import { SETTINGS } from "./config.js";
import { Game } from "./game/Game.js";
import { newLogger } from "./logger.js";
import { SocketEvents } from "./socketEvents.js";
import type {
  GameSettings,
  PlayerAction,
  PlayerActionType,
  PlayerInfo,
} from "./types.js";
import { Bot } from "./bot/index.js";
import type { Messenger } from "./game/Messenger.js";

const logger = newLogger("GameManager");

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
    logger.info("GameManager initialized");
  }

  public static getInstance(io?: Server): GameManager {
    if (!GameManager.instance) {
      if (!io)
        throw new Error(
          "IO instance required for initial GameManager creation"
        );
      GameManager.instance = new GameManager(io);
    }
    return GameManager.instance;
  }

  public joinGame(
    gameId: string,
    player: PlayerInfo,
    messenger: Messenger
  ): void {
    logger.info(
      `Joining game: ${gameId} for player: ${player.name} with socket id: ${messenger.id}`
    );
    if (this.isPlayerInGame(messenger)) {
      messenger.emitToPlayer(
        SocketEvents.ERROR,
        "Player is already in a game."
      );
      return;
    }

    const game = this.getOrCreateGame(gameId);

    logger.info("Game stage before joining", game.getStage());
    logger.info("Current player count", game.getPlayerCount());

    messenger.leave(SETTINGS.LOBBY_ROOM);
    messenger.join(game.gameId);

    logger.info(
      `Player removed from lobby and joined game id:"${game.gameId}"`
    );

    const playerAdditionResult = game.addPlayer(messenger, player);

    this.socketPlayerMap.set(messenger.id, player);

    if (playerAdditionResult) {
      logger.info(`Player successfully added to game: ${player.name}`);
      this.emitPlayerLeftLobby(messenger.id, player.name);
    } else {
      logger.error(`Player addition failed: ${playerAdditionResult}`);
      this.initPlayerInLobby(player, messenger);
    }
    // Update the lobby with the new game
    this.emitLobbyUpdate();

    // If there is only one player, add a bot
    if (game.getPlayerCount() === 1) {
      this.addBotPlayer(game.gameId);
    }
  }

  public leaveGame(messenger: Messenger): void {
    // socket.rooms is a Set, it will always contain the socket's identifier
    // but we want to find any game id
    const gameId = Array.from(messenger.getRooms()).find(
      (room) => room !== messenger.id && this.games.has(room)
    );

    if (!gameId) {
      messenger.emitToPlayer(SocketEvents.ERROR, "Player is not in a game.");
      return;
    }

    const game = this.games.get(gameId);
    if (!game) {
      messenger.emitToPlayer(SocketEvents.ERROR, "Game does not exist.");
      return;
    }

    game.removePlayer(messenger);

    messenger.leave(gameId); // Remove player from game
    messenger.join(SETTINGS.LOBBY_ROOM); // Add player to lobby

    // Emit player joined lobby event
    this.initPlayerInLobby(this.socketPlayerMap.get(messenger.id)!, messenger);

    // If the game is empty, remove it
    if (game.getPlayerCount() === 0) {
      this.games.delete(gameId);
    }
  }

  public initPlayerInLobby(player: PlayerInfo, messenger: Messenger): void {
    messenger.join(SETTINGS.LOBBY_ROOM);
    this.socketPlayerMap.set(messenger.id, player);

    // Emit player joined lobby event
    this.emitPlayerJoinedLobby(messenger.id, player.name);

    // Emit all lobby players to the new player
    const lobbyPlayers = Array.from(this.socketPlayerMap.values())
      .filter((p) => p.id !== messenger.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        action: "join",
      }));
    GameManager.io
      .to(messenger.id)
      .emit(SocketEvents.LOBBY_PLAYER_UPDATE, lobbyPlayers);
  }

  public getLobbyPlayer(playerId: string): PlayerInfo | undefined {
    return this.socketPlayerMap.get(playerId);
  }

  public handleDisconnect(socket: Socket): void {
    // Call this in socket io "disconnecting" event in order to access the socket's rooms

    // Make sure the player is removed from any games they are in
    // also remove them from the lobby
    socket.rooms.forEach((room, isLobby) => {
      logger.info("Removing player from game", room, isLobby);
      const game = this.games.get(room);
      if (game) {
        game.removePlayer(socket);
        // If the game is empty, remove it
        if (game.getPlayerCount() === 0) {
          this.games.delete(game.gameId);
        }
      }
      socket.leave(room);
    });

    // Emit player left lobby event
    this.emitPlayerLeftLobby(
      socket.id,
      this.socketPlayerMap.get(socket.id)?.name
    );

    this.socketPlayerMap.delete(socket.id);
  }

  public handlePlayCard(socket: Socket): void {
    logger.info("Routing play card to game", socket.id);
    this.performGameAction(socket, (game) => game.handlePlayCard(socket));
  }

  public handleSlapPile(socket: Socket): void {
    logger.info("Routing slap pile to game", socket.id);
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
      })
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

  public setGameSettings(
    socket: Socket,
    gameId: string | undefined,
    settings: GameSettings
  ): void {
    const game = this.getGameForSocket(socket, gameId);
    if (game) {
      game.setGameSettings(settings);
    }
  }

  public setPlayerName(socketId: string, playerName: string): void {
    logger.info(`Setting player name: ${socketId} ${playerName}`);
    const player = this.getLobbyPlayer(socketId);
    if (player) {
      player.name = playerName;
      this.socketPlayerMap.set(socketId, player);

      GameManager.io
        .to(SETTINGS.LOBBY_ROOM)
        .emit(SocketEvents.LOBBY_PLAYER_UPDATE, [
          {
            id: socketId,
            name: playerName,
            action: "update",
          },
        ]);
    }
  }

  public startVote(socket: Socket, topic: string): void {
    this.performGameAction(socket, (game) => {
      logger.info(`Starting vote on game: ${game.gameId}`);
      game.startVote(topic);
    });
  }

  public submitVote(socket: Socket, vote: boolean): void {
    this.performGameAction(socket, (game) => game.submitVote(socket.id, vote));
  }

  private isPlayerInGame(messenger: Messenger): boolean {
    return Array.from(messenger.getRooms()).some((room) =>
      this.games.has(room)
    );
  }

  private getOrCreateGame(gameId: string): Game {
    logger.info(`Getting or creating game id:"${gameId}"`);
    if (!this.games.has(gameId) || gameId === "") {
      logger.info("Generating new game", gameId);
      gameId = gameId || this.generateGameId();
      this.games.set(gameId, new Game(GameManager.io, gameId));
    }
    return this.games.get(gameId)!;
  }

  private emitPlayerLeftLobby(id: string, name: string | undefined): void {
    if (!name) {
      name = this.generatePlayerName();
      this.setPlayerName(id, name);
    }

    logger.info("Emitting player left lobby", id, name);

    GameManager.io
      .to(SETTINGS.LOBBY_ROOM)
      .emit(SocketEvents.LOBBY_PLAYER_UPDATE, [
        {
          id,
          name,
          action: "leave",
        },
      ]);
  }

  private emitPlayerJoinedLobby(id: string, name: string): void {
    GameManager.io
      .to(SETTINGS.LOBBY_ROOM)
      .emit(SocketEvents.LOBBY_PLAYER_UPDATE, [
        {
          id,
          name,
          action: "join",
        },
      ]);
  }

  private emitLobbyUpdate(): void {
    GameManager.io
      .to(SETTINGS.LOBBY_ROOM)
      .emit(SocketEvents.LOBBY_GAME_UPDATE, {
        games: Array.from(this.games.values()).map((game) => ({
          id: game.gameId,
          name: game.gameId,
          playerCount: game.getPlayerCount(),
          maxPlayers: game.getGameSettings().maximumPlayers,
        })),
      });
  }

  private emitError(socket: Socket, message: string): void {
    socket.emit(SocketEvents.ERROR, message);
  }

  private performGameAction(
    socket: Socket,
    action: (game: Game) => void
  ): void {
    const game = this.getGameForSocket(socket);
    if (game) {
      logger.info("Performing game action on game", game.gameId);
      action(game);
    }
  }

  private getGameForSocket(socket: Socket, gameId?: string): Game | undefined {
    gameId =
      gameId ||
      Array.from(socket.rooms).find(
        (room) => room !== socket.id && this.games.has(room)
      );
    if (!gameId) {
      this.emitError(socket, "Player is not in a game.");
      return;
    }
    return this.games.get(gameId);
  }

  private generateGameId(): string {
    const nouns = SETTINGS.GENERATORS.GAME_ID.NOUNS;
    const adjectives = SETTINGS.GENERATORS.GAME_ID.ADJECTIVES;

    let gameId: string;
    do {
      // Generate a random game ID
      gameId = `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}`;
    } while (this.games.has(gameId)); // Check if the ID already exists

    return gameId;
  }

  private generatePlayerName(): string {
    const adjectives = SETTINGS.GENERATORS.PLAYER_NAME.ADJECTIVES;
    const names = SETTINGS.GENERATORS.PLAYER_NAME.NOUNS;
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
  }

  private addBotPlayer(gameId: string): void {
    logger.info(`Adding bot player to game: ${gameId}`);
    const bot = new Bot("Alvin");
    const game = this.getOrCreateGame(gameId);
    if (bot.messenger) {
      game.addPlayer(bot.messenger, bot.playerInfo);
    }
  }
}
