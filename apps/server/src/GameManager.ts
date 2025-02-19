import type { WebSocketServer } from "ws";
import { SETTINGS } from "@oer/configuration";
import { Game } from "./game/Game.js";
import { newLogger } from "./logger.js";
import { SocketEvents } from "@oer/shared";
import {
  type GameSettings,
  type PlayerAction,
  PlayerActionType,
  type PlayerInfo,
} from "@oer/shared";
import { Bot } from "./bot/index.js";
import { type Room, Messenger } from "@oer/message";
import { MessageServer } from "@oer/message/server";
import { defaultSlapRules } from "./game/rules/SlapRules.js";

const logger = newLogger("GameManager");

export class GameManager {
  private static instance: GameManager;
  private static messageServer: MessageServer;

  /**
   * Maps room IDs to their corresponding game instances
   */
  private games: Map<string, Game> = new Map();

  /**
   * Maps messenger IDs to the corresponding player information.
   */
  private playerMap: Map<string, PlayerInfo> = new Map();

  private constructor() {
    GameManager.messageServer = new MessageServer();
    logger.info("GameManager initialized");
  }

  public static getInstance(wss: WebSocketServer): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public getMessageServer(): MessageServer {
    return GameManager.messageServer;
  }

  public getLobbyPlayer(playerId: string): PlayerInfo | undefined {
    return this.playerMap.get(playerId);
  }

  // GameManager.ts - Modified methods only

  private isInGlobalRoom(room: Room | undefined): boolean {
    return (
      !room ||
      room.getId() === GameManager.messageServer.getGlobalRoom().getId()
    );
  }

  private getCurrentRoom(messenger: Messenger): Room | undefined {
    return GameManager.messageServer.getMessengerRoom(messenger);
  }

  private isPlayerInGameRoom(messenger: Messenger): boolean {
    const currentRoom = this.getCurrentRoom(messenger);
    return !this.isInGlobalRoom(currentRoom);
  }

  private handleJoinError(messenger: Messenger, message: string): void {
    logger.error(message, messenger.id);
    this.emitError(messenger, message);
  }

  private addPlayerToGameRoom(
    messenger: Messenger,
    gameRoom: Room,
    player: PlayerInfo
  ): boolean {
    const wasAdded = GameManager.messageServer.moveMessengerToRoom(
      messenger,
      gameRoom.getId()
    );

    if (!wasAdded) {
      this.handleJoinError(
        messenger,
        "Failed to join game room - room might be full."
      );
      this.initPlayerInLobby(player, messenger);
      return false;
    }

    logger.info(`Player successfully added to room: ${gameRoom.getId()}`);
    return true;
  }

  private addPlayerToGame(
    messenger: Messenger,
    game: Game,
    player: PlayerInfo
  ): boolean {
    const playerAdditionResult = game.addPlayer(messenger, player);
    this.playerMap.set(messenger.id, player);

    if (!playerAdditionResult) {
      logger.error("Player failed to join game");
      // Remove the player from the game room
      GameManager.messageServer.removeMessengerFromRoom(messenger);
      this.initPlayerInLobby(player, messenger);
      return false;
    }

    logger.info(`Player successfully added to game: ${player.name}`);
    this.emitPlayerLeftLobby(messenger.id, player.name);
    return true;
  }

  public joinGame(
    gameId: string,
    player: PlayerInfo,
    messenger: Messenger
  ): void {
    if (this.isPlayerInGameRoom(messenger)) {
      this.handleJoinError(messenger, "Player is already in a game.");
      return;
    }

    const { game, gameRoom } = this.getOrCreateGame(gameId);

    if (!game) {
      this.handleJoinError(messenger, "Failed to find game.");
      return;
    }

    if (!this.addPlayerToGameRoom(messenger, gameRoom, player)) {
      return;
    }

    if (!this.addPlayerToGame(messenger, game, player)) {
      return;
    }

    this.emitLobbyUpdate();
  }

  public leaveGame(messenger: Messenger): void {
    const currentRoom = this.getCurrentRoom(messenger);
    if (this.isInGlobalRoom(currentRoom)) {
      messenger.emit(SocketEvents.ERROR, {
        data: "Player is not in a game.",
      });
      return;
    }

    if (!currentRoom) {
      messenger.emit(SocketEvents.ERROR, {
        data: "Room not found.",
      });
      return;
    }

    const game = this.games.get(currentRoom.getId());
    if (!game) {
      messenger.emit(SocketEvents.ERROR, {
        data: "Game not found.",
      });
      return;
    }

    game.removePlayer(messenger);
    GameManager.messageServer.moveMessengerToRoom(
      messenger,
      GameManager.messageServer.getGlobalRoom().getId()
    );

    // Add player back to lobby
    const player = this.playerMap.get(messenger.id);
    if (player) {
      this.initPlayerInLobby(player, messenger);
    }

    // If the game is empty, clean up
    if (game.getPlayerCount() === 0) {
      this.games.delete(currentRoom.getId());
    }
  }

  public initPlayerInLobby(player: PlayerInfo, messenger: Messenger): void {
    GameManager.messageServer.moveMessengerToRoom(
      messenger,
      GameManager.messageServer.getGlobalRoom().getId()
    );
    this.playerMap.set(messenger.id, player);

    // Emit player joined lobby event
    this.emitPlayerJoinedLobby(messenger.id, player.name);

    // Emit all lobby players to the new player
    const lobbyPlayers = Array.from(this.playerMap.values())
      .filter((p) => p.id !== messenger.id)
      .map((p) => ({
        id: p.id,
        name: p.name,
        action: "join",
      }));

    messenger.emit(SocketEvents.LOBBY_PLAYER_UPDATE, lobbyPlayers);
  }

  public handleDisconnect(messenger: Messenger): void {
    const currentRoom = this.getCurrentRoom(messenger);
    if (!this.isInGlobalRoom(currentRoom) && currentRoom) {
      const game = this.games.get(currentRoom.getId());
      if (game) {
        game.removePlayer(messenger);
        if (game.getPlayerCount() === 0) {
          this.games.delete(currentRoom.getId());
        }
      }
    }

    GameManager.messageServer.removeMessengerFromRoom(messenger);

    // Emit player left lobby event
    this.emitPlayerLeftLobby(
      messenger.id,
      this.playerMap.get(messenger.id)?.name
    );
    this.playerMap.delete(messenger.id);
  }

  private routeGameAction(
    messenger: Messenger,
    action: (game: Game) => void,
    shouldLog = false
  ): void {
    const game = this.getGameForMessenger(messenger);
    if (game) {
      if (shouldLog) {
        logger.info("Performing game action on game", game.gameId);
      }
      action(game);
    }
  }

  public performPlayerAction(messenger: Messenger, action: PlayerAction): void {
    this.routeGameAction(messenger, (g) => g.performPlayerAction(action));
  }

  public handlePlayCard = (messenger: Messenger) =>
    this.routeGameAction(messenger, (g) => g.handlePlayCard(messenger));

  public handleSlapPile = (messenger: Messenger) =>
    this.routeGameAction(messenger, (g) => g.handleSlapAttempt(messenger));

  public handlePlayerReady = (messenger: Messenger) =>
    this.performPlayerAction(messenger, {
      playerId: messenger.id,
      actionType: PlayerActionType.SET_READY,
      data: { ready: true },
      timestamp: Date.now(),
    });

  public getGameSettings(messenger: Messenger, gameId?: string): void {
    this.routeGameAction(messenger, (game) => {
      messenger.emit(SocketEvents.SET_GAME_SETTINGS, game.getGameSettings());
    });
  }

  public setGameSettings(
    messenger: Messenger,
    gameId: string | undefined,
    settings: GameSettings
  ): void {
    this.routeGameAction(messenger, (game) => game.setGameSettings(settings));
  }

  public setPlayerName(playerId: string, playerName: string): void {
    logger.info(`Setting player name: ${playerId} ${playerName}`);
    const player = this.getLobbyPlayer(playerId);
    if (player) {
      player.name = playerName;
      this.playerMap.set(playerId, player);

      // Emit to all clients in the lobby room
      this.getMessageServer()
        .getGlobalRoom()
        .emit(SocketEvents.LOBBY_PLAYER_UPDATE, [
          {
            id: playerId,
            name: playerName,
            action: "update",
          },
        ]);
    }
  }

  public startVote(messenger: Messenger, topic: string): void {
    this.routeGameAction(
      messenger,
      (game) => {
        logger.info(`Starting vote on game: ${game.gameId}`);
        game.startVote(topic);
      },
      true
    );
  }

  public submitVote(messenger: Messenger, vote: boolean): void {
    this.routeGameAction(messenger, (game) =>
      game.submitVote(messenger.id, vote)
    );
  }

  private isPlayerInGame(messenger: Messenger): boolean {
    const currentRoom = GameManager.messageServer.getMessengerRoom(messenger);
    return (
      currentRoom?.getId() !== GameManager.messageServer.getGlobalRoom().getId()
    );
  }

  private getOrCreateGame(gameId: string): { game: Game; gameRoom: Room } {
    let game = this.games.get(gameId);
    let gameRoom = GameManager.messageServer.getRoom(gameId);

    if (!game || !gameRoom) {
      const newGameId = this.generateGameId(); // TODO: Consider using unique ids for games and rooms

      gameRoom = GameManager.messageServer.createRoom(
        newGameId,
        `Game ${newGameId}`,
        4 // Default max players
      );
      game = new Game(newGameId, gameRoom, defaultSlapRules);
      this.games.set(gameId, game);
    }

    return { game, gameRoom };
  }

  private emitPlayerLeftLobby(id: string, name: string | undefined): void {
    const finalName = name || this.generatePlayerName();
    if (!name) {
      this.setPlayerName(id, finalName);
    }

    logger.info("Emitting player left lobby", id, finalName);

    // Emit to all clients in the lobby room
    this.getMessageServer()
      .getGlobalRoom()
      .emit(SocketEvents.LOBBY_PLAYER_UPDATE, [
        {
          id,
          name: finalName,
          action: "leave",
        },
      ]);
  }

  private emitPlayerJoinedLobby(id: string, name: string): void {
    // Emit to all clients in the lobby room
    this.getMessageServer()
      .getGlobalRoom()
      .emit(SocketEvents.LOBBY_PLAYER_UPDATE, [
        {
          id,
          name,
          action: "join",
        },
      ]);
  }

  private emitLobbyUpdate(): void {
    // Emit to all clients in the lobby room
    this.getMessageServer()
      .getGlobalRoom()
      .emit(SocketEvents.LOBBY_GAME_UPDATE, {
        games: Array.from(this.games.values()).map((game) => ({
          id: game.gameId,
          name: game.gameId,
          playerCount: game.getPlayerCount(),
          maxPlayers: game.getGameSettings().maximumPlayers,
        })),
      });
  }

  private emitError(messenger: Messenger, message: string): void {
    messenger.emit(SocketEvents.ERROR, message);
  }

  private performGameAction(
    messenger: Messenger,
    action: (game: Game) => void
  ): void {
    const game = this.getGameForMessenger(messenger);
    if (game) {
      logger.info("Performing game action on game", game.gameId);
      action(game);
    }
  }

  private getGameForMessenger(
    messenger: Messenger,
    gameId?: string
  ): Game | undefined {
    // FIXME: messenger.id is "" for some reason?
    logger.info("Getting game for messenger", messenger.id);
    logger.info(
      "\tMessenger rooms",
      JSON.stringify(messenger.getRooms(), null, 2) // Nothing in here
    );
    logger.info(
      "\tMessage Server Room",
      JSON.stringify(
        GameManager.messageServer.getMessengerRoom(messenger), // Also nothing in here
        null,
        2
      )
    );

    const finalGameId =
      gameId ||
      messenger.getRooms().find((room) => this.games.has(room)) ||
      GameManager.messageServer.getMessengerRoom(messenger)?.getId();
    if (!finalGameId) {
      this.emitError(messenger, "Player is not in a game.");
      return;
    }
    return this.games.get(finalGameId);
  }

  private generateGameId(): string {
    const nouns = SETTINGS.GENERATORS.GAME_ID.NOUNS;
    const adjectives = SETTINGS.GENERATORS.GAME_ID.ADJECTIVES;

    let gameId: string;
    do {
      // Generate a random game ID
      gameId = `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${
        nouns[Math.floor(Math.random() * nouns.length)]
      }`;
    } while (this.games.has(gameId)); // Check if the ID already exists

    return gameId;
  }

  private generatePlayerName(): string {
    const adjectives = SETTINGS.GENERATORS.PLAYER_NAME.ADJECTIVES;
    const names = SETTINGS.GENERATORS.PLAYER_NAME.NOUNS;
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
      names[Math.floor(Math.random() * names.length)]
    }`;
  }

  private addBotPlayer(gameId: string): void {
    logger.info(`Adding bot player to game: ${gameId}`);
    const bot = new Bot(Messenger.createBot());
    const { game, gameRoom } = this.getOrCreateGame(gameId);
    if (bot.messenger) {
      game.addPlayer(bot.messenger, bot.playerInfo);
      gameRoom.addMessenger(bot.messenger);
    }
  }
}
