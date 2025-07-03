import type { EventData, Messenger, Room } from "@oer/message";
import { SocketEvents } from "@oer/shared/socketEvents";
import {
	type GameSettings,
	type PlayerAction,
	PlayerActionType,
	type PlayerInfo,
	PlayerInfoAction,
	type PlayerInfoUpdate,
} from "@oer/shared/types";
import { Bot } from "../bot/index.js";
import { Game } from "../game/models/Game.js";
import { defaultSlapRules } from "../game/rules/SlapRules.js";
import { newLogger } from "../logger.js";
import { MessageServer } from "../message/messageServer.js";
import { generateGameId, generatePlayerName } from "./utils.js";

const logger = newLogger("GameManager");

export class GameManager {
	private static instance: GameManager;
	public static messageServer: MessageServer;

	private constructor() {
		GameManager.messageServer = new MessageServer();
		logger.info("GameManager initialized");
	}

	public static getInstance(): GameManager {
		if (!GameManager.instance) {
			GameManager.instance = new GameManager();
		}
		return GameManager.instance;
	}

	/**
	 * Helper to access player info from a messenger
	 * @param messenger - The messenger to get the player info from
	 * @returns The player info or undefined if it doesn't exist
	 */
	public getPlayerInfo(messenger: Messenger): PlayerInfo | undefined {
		return messenger.getData("playerInfo");
	}

	/**
	 * Helper to check if a messenger is in the lobby
	 * @param messenger - The messenger to check
	 * @returns True if the messenger is in the lobby, false otherwise
	 */
	private inLobby(messenger: Messenger): boolean {
		const lobbyRoom = GameManager.messageServer.getGlobalRoom();
		return lobbyRoom.hasMessenger(messenger);
	}

	/**
	 * Helper to check if a messenger is in a game room and not the lobby
	 * @param messenger - The messenger to check
	 * @returns True if the messenger is in a game room, false otherwise
	 */
	private inGameRoom(messenger: Messenger): boolean {
		const room = this.getCurrentRoom(messenger);
		return room !== undefined && !this.inLobby(messenger);
	}

	/**
	 * Helper to get the current room for a messenger
	 * @param messenger - The messenger to get the current room for
	 * @returns The current room or undefined if it doesn't exist
	 */
	private getCurrentRoom(messenger: Messenger): Room | undefined {
		return GameManager.messageServer.getMessengerRoom(messenger);
	}

	/**
	 * Helper to emit a join error to a messenger
	 * Example errors: the game is full, the game doesn't exist, or the player is already in a game
	 * @param messenger - The messenger to emit the error to
	 * @param message - The message to emit
	 */
	private handleJoinError(messenger: Messenger, message: string): void {
		logger.error(message, messenger.id);
		this.emitError(messenger, message);
	}

	/**
	 * Helper to move a player to a game room
	 * @param messenger - The messenger to move to the game room
	 * @param gameRoom - The game room to move the player to
	 * @returns True if the player was moved to the game room, false otherwise
	 */
	private addPlayerToGameRoom(messenger: Messenger, gameRoom: Room): boolean {
		const wasAdded = GameManager.messageServer.moveMessengerToRoom(
			messenger,
			gameRoom.getId(),
		);

		if (!wasAdded) {
			this.handleJoinError(
				messenger,
				"Failed to join game room - room might be full.",
			);
			this.addPlayerToLobby(messenger);
			return false;
		}

		logger.info(`Player successfully added to room: ${gameRoom.getId()}`);
		return true;
	}

	public joinGame(roomId: string, messenger: Messenger): void {
		logger.info(`Joining game: ${roomId} for messenger: ${messenger.id}`);

		if (this.inGameRoom(messenger)) {
			this.handleJoinError(messenger, "Player is already in a game.");
			return;
		}

		const { game, gameRoom } = this.getOrCreateGame(roomId);

		if (!game) {
			this.handleJoinError(messenger, "Failed to find game.");
			return;
		}

		if (!this.addPlayerToGameRoom(messenger, gameRoom)) {
			return;
		}

		this.emitToLobby(...this.lobbyGameUpdate());
	}

	public leaveGame(messenger: Messenger): void {
		const currentRoom = this.getCurrentRoom(messenger);
		if (this.inLobby(messenger)) {
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

		const game = this.getGameForMessenger(messenger);
		if (!game) {
			messenger.emit(SocketEvents.ERROR, {
				data: "Game not found.",
			});
			return;
		}

		game.removePlayer(messenger);
		this.addPlayerToLobby(messenger);
	}

	public addBot(messenger: Messenger): void {
		if (!this.inGameRoom(messenger)) {
			this.handleJoinError(messenger, "Player is not in a game.");
			return;
		}
		const bot = new Bot();

		const gameRoom = this.getCurrentRoom(messenger);
		const gameRoomId = gameRoom?.getId();

		if (!gameRoomId) {
			this.handleJoinError(messenger, "Failed to find game room.");
			return;
		}

		this.joinGame(gameRoomId, bot.messenger);
	}

	public addPlayerToLobby(messenger: Messenger): void {
		GameManager.messageServer.moveMessengerToRoom(
			messenger,
			GameManager.messageServer.getGlobalRoom().getId(),
		);

		// Emit player joined lobby event
		this.emitPlayerJoinedLobby(messenger);

		// Update the lobby player list for the new player
		const lobbyPlayers = GameManager.messageServer
			.getGlobalRoom()
			.getMessengers(messenger)
			.map((player) =>
				this.createPlayerUpdate(player, PlayerInfoAction.UPDATE),
			);

		messenger.emit(SocketEvents.LOBBY_PLAYER_UPDATE, lobbyPlayers);

		// Update the games list for the new player
		messenger.emit(...this.lobbyGameUpdate());
	}

	private emitToLobby(
		event: string,
		data: EventData,
		excludeMessengers?: Messenger[],
	): void {
		GameManager.messageServer
			.getGlobalRoom()
			.emit(event, data, excludeMessengers);
	}

	public handleDisconnect(messenger: Messenger): void {
		GameManager.messageServer.removeMessengerFromRoom(messenger);
		this.emitPlayerLeftLobby(messenger);
	}

	private routeGameAction(
		messenger: Messenger,
		action: (game: Game) => void,
		shouldLog = true,
	): void {
		const game = this.getGameForMessenger(messenger);
		if (game) {
			if (shouldLog) {
				logger.info(`Performing game action on game: ${game.gameId}`);
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

	public getGameSettings(messenger: Messenger): void {
		this.routeGameAction(messenger, (game) => {
			messenger.emit(SocketEvents.SET_GAME_SETTINGS, game.getGameSettings());
		});
	}

	public setGameSettings(messenger: Messenger, settings: GameSettings): void {
		this.routeGameAction(messenger, (game) => game.setGameSettings(settings));
	}

	public setPlayerName(messenger: Messenger, playerName: string): void {
		logger.info(`Setting player name: ${messenger.id} ${playerName}`);

		if (this.inLobby(messenger)) {
			const player = this.getPlayerInfo(messenger);

			if (player) {
				player.name = playerName;
				this.emitToLobby(SocketEvents.LOBBY_PLAYER_UPDATE, [
					this.createPlayerUpdate(messenger, PlayerInfoAction.UPDATE),
				]);
			}
		} else {
			logger.warn("Set player name failed - player not in lobby", messenger.id);
			logger.warn(
				`Messenger Rooms ${Array.from(messenger.getRooms().values())}`,
			);
			this.emitError(messenger, "Player is not in the lobby.");
		}
	}

	public startVote(messenger: Messenger, topic: string): void {
		this.routeGameAction(
			messenger,
			(game) => {
				logger.info(`Starting vote on game: ${game.gameId}`);
				game.startVote(topic);
			},
			true,
		);
	}

	public submitVote(messenger: Messenger, vote: boolean): void {
		this.routeGameAction(messenger, (game) =>
			game.submitVote(messenger.id, vote),
		);
	}

	private getOrCreateGame(roomId: string): { game: Game; gameRoom: Room } {
		let gameRoom = GameManager.messageServer.getRoom(roomId);
		let game = gameRoom?.getData("game") as Game | undefined;

		if (!(game && gameRoom)) {
			if (!gameRoom) {
				logger.warn(`No game room found for room: ${roomId}`);
			}
			if (!game) {
				logger.warn(`No game found for room: ${roomId}`);
			}

			const newGameId = generateGameId(GameManager.messageServer);

			gameRoom = GameManager.messageServer.createRoom(
				newGameId,
				`Game ${newGameId}`,
				4, // Default max players
			);
			game = new Game(newGameId, gameRoom, defaultSlapRules);
			gameRoom.setData("game", game);

			// Add hooks for the game room to automatically add and remove players from the game
			gameRoom.addHook("addMessenger", (messenger) => {
				const playerAdditionResult = game?.addPlayer(
					messenger,
					messenger.getData("playerInfo"),
				);
				if (!playerAdditionResult) {
					logger.error("Player failed to join game");
					// Remove the player from the game room
					GameManager.messageServer.removeMessengerFromRoom(messenger);
					this.addPlayerToLobby(messenger);
				}
			});
			gameRoom.addHook("removeMessenger", (messenger) => {
				game?.removePlayer(messenger);
				const realPlayers = game?.getPlayerCount(true);
				// If there are no real players, destroy the game
				if (realPlayers === 0) {
					logger.info("No real players left in game, destroying game");
					gameRoom?.setData("game", undefined);
					game = undefined;
				}
			});
		}

		return { game, gameRoom };
	}

	private emitPlayerLeftLobby(messenger: Messenger): void {
		this.emitToLobby(SocketEvents.LOBBY_PLAYER_UPDATE, [
			this.createPlayerUpdate(messenger, PlayerInfoAction.LEAVE),
		]);
	}

	private emitPlayerJoinedLobby(messenger: Messenger): void {
		this.emitToLobby(SocketEvents.LOBBY_PLAYER_UPDATE, [
			this.createPlayerUpdate(messenger, PlayerInfoAction.JOIN),
		]);
	}

	private lobbyGameUpdate(): [
		typeof SocketEvents.LOBBY_GAME_UPDATE,
		EventData,
	] {
		const lobbyRoomId = GameManager.messageServer.getGlobalRoom().getId();
		return [
			SocketEvents.LOBBY_GAME_UPDATE,
			{
				games: Array.from(GameManager.messageServer.getRooms().values())
					.filter((room) => room.getId() !== lobbyRoomId)
					.map((room) => ({
						id: room.getId(),
						name: room.getId(),
						playerCount: room.getMessengers().length,
						maxPlayers: room.getSize(),
					})),
			},
		];
	}

	private emitError(messenger: Messenger, message: string): void {
		messenger.emit(SocketEvents.ERROR, message);
	}

	private getGameForMessenger(messenger: Messenger): Game | undefined {
		const currentRoom = this.getCurrentRoom(messenger);
		if (this.inLobby(messenger)) {
			this.emitError(messenger, "Player is not in a game.");
			return;
		}

		return currentRoom?.getData("game");
	}

	/**
	 * Creates a player update action object with proper error handling for missing player info
	 * @param messenger - The messenger representing the player
	 * @param action - The type of update action (join, leave, or update)
	 * @returns A standardized player update action object
	 */
	private createPlayerUpdate(
		messenger: Messenger,
		action: PlayerInfoAction,
	): PlayerInfoUpdate {
		const playerInfo = messenger.getData("playerInfo");
		return {
			id: messenger.id,
			name: playerInfo?.name || generatePlayerName(),
			action,
			isBot: playerInfo?.isBot,
		};
	}
}
