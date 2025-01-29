import type { Server, Socket } from "socket.io";
import { GameManager } from "./GameManager.js";
import { newLogger } from "./logger.js";
import {
  type MessagePayload,
  SocketEvents,
  type SocketPayloads,
} from "./socketEvents.js";
import type { GameSettings, PlayerAction } from "./types.js";
import { Messenger } from "./game/Messenger.js";

const logger = newLogger("socketHandlers");

let io: Server;
let gameManager: GameManager;

export function setupSocketHandlers(ioServer: Server) {
  io = ioServer;
  gameManager = GameManager.getInstance(io);

  io.on(SocketEvents.CONNECT, (socket: Socket) => {
    logger.info(`A user connected: ${socket.id}`);

    const client = new Messenger(false, socket);

    // Add the player to the lobby via GameManager
    gameManager.initPlayerInLobby(
      {
        id: client.id,
        name: "",
        isBot: false,
      },
      client
    );

    socket.use((request_event, next) => {
      const [event, ...payload] = request_event;
      logger.info(`REQUEST: ${event} ${JSON.stringify(payload)}`);
      next();
    });

    socket.on(
      SocketEvents.CHANGE_NAME,
      ({ name }: SocketPayloads[SocketEvents.CHANGE_NAME]) => {
        gameManager.setPlayerName(socket.id, name);
      }
    );

    socket.on(
      SocketEvents.JOIN_GAME,
      ({ gameId }: SocketPayloads[SocketEvents.JOIN_GAME]) => {
        const player = gameManager.getLobbyPlayer(socket.id);
        if (player) {
          gameManager.joinGame(gameId, player, socket);
        }
      }
    );

    socket.on(SocketEvents.CREATE_GAME, () => {
      const player = gameManager.getLobbyPlayer(socket.id);
      if (player) {
        gameManager.joinGame("", player, socket);
      }
    });

    socket.on(SocketEvents.LEAVE_GAME, () => {
      gameManager.leaveGame(socket);
    });

    socket.on(
      SocketEvents.PLAY_CARD,
      (_props: SocketPayloads[SocketEvents.PLAY_CARD]) => {
        gameManager.handlePlayCard(socket);
      }
    );

    socket.on(
      SocketEvents.SLAP_PILE,
      (_props: SocketPayloads[SocketEvents.SLAP_PILE]) => {
        gameManager.handleSlapPile(socket);
      }
    );

    socket.on(SocketEvents.PLAYER_READY, () => {
      gameManager.handlePlayerReady(socket);
    });

    socket.on(SocketEvents.PLAYER_ACTION, (action: PlayerAction) => {
      gameManager.performPlayerAction(socket, action);
    });

    socket.on(SocketEvents.SET_GAME_SETTINGS, (settings: GameSettings) => {
      gameManager.setGameSettings(socket, undefined, settings);
    });

    socket.on(SocketEvents.MESSAGE, (message: MessagePayload) => {
      const { message: messageText, timestamp } = message;
      logger.info(`Received message: ${socket.id} ${messageText} ${timestamp}`);
      // gameManager.handleMessage(socket, message);
    });

    socket.on(SocketEvents.ERROR, (error: Error) => {
      logger.error(error);
      socket.emit(SocketEvents.ERROR, error.message);
    });

    socket.on(SocketEvents.DISCONNECTING, () => {
      logger.info(`Disconnecting player: ${socket.id}`);
      gameManager.handleDisconnect(socket);
    });

    socket.on(SocketEvents.DISCONNECT, () => {
      logger.info(`A user disconnected: ${socket.id}`);
    });
  });
}
