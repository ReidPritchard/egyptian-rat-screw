import type { WebSocketServer, WebSocket } from "ws";
import { GameManager } from "./GameManager.js";
import { newLogger } from "./logger.js";
import {
  type MessagePayload,
  SocketEvents,
  type SocketPayloads,
} from "./socketEvents.js";
import type { GameSettings, PlayerAction } from "./types.js";
import { Messenger } from "@oer/message";

const logger = newLogger("socketHandlers");

let wss: WebSocketServer;
let gameManager: GameManager;

interface WebSocketMessage {
  event: string;
  data?: any;
}

export function setupWebSocketHandlers(wsServer: WebSocketServer) {
  wss = wsServer;
  gameManager = GameManager.getInstance(wss);

  wss.on("connection", (socket: WebSocket) => {
    logger.info("A user connected");

    const client = new Messenger(false, socket);
    logger.info(`Client: ${client.id}`);

    logger.info("Setting up socket handlers");
    socket.on("message", (data: string) => {
      logger.info(`Received message: ${data}`);

      try {
        const message: WebSocketMessage = JSON.parse(data);
        logger.info(
          `REQUEST: ${message.event} ${JSON.stringify(message.data)}`
        );

        switch (message.event) {
          case "connection_init":
            logger.info("Received connection_init event, registering client");
            gameManager.getMessageServer().register(client);

            logger.info("Adding player to lobby");
            // Add the player to the lobby via GameManager
            gameManager.initPlayerInLobby(
              {
                id: client.id,
                name: "",
                isBot: false,
              },
              client
            );
            logger.info(
              `Player: ${JSON.stringify(gameManager.getLobbyPlayer(client.id))}`
            );
            break;

          case SocketEvents.CHANGE_NAME:
            gameManager.setPlayerName(
              client.id,
              (message.data as SocketPayloads[SocketEvents.CHANGE_NAME]).name
            );
            break;

          case SocketEvents.JOIN_GAME: {
            const player = gameManager.getLobbyPlayer(client.id);
            if (player) {
              gameManager.joinGame(
                (message.data as SocketPayloads[SocketEvents.JOIN_GAME]).gameId,
                player,
                client
              );
            }
            break;
          }

          case SocketEvents.CREATE_GAME: {
            const createPlayer = gameManager.getLobbyPlayer(client.id);
            if (createPlayer) {
              // Update the player's name if one is provided in the event payload
              if (message.data?.playerName) {
                createPlayer.name = message.data.playerName;
              }

              gameManager.joinGame("", createPlayer, client);
            }
            logger.info("CREATE_GAME: request completed");
            break;
          }

          case SocketEvents.LEAVE_GAME:
            gameManager.leaveGame(client);
            break;

          case SocketEvents.PLAY_CARD:
            gameManager.handlePlayCard(client);
            break;

          case SocketEvents.SLAP_PILE:
            gameManager.handleSlapPile(client);
            break;

          case SocketEvents.PLAYER_READY:
            gameManager.handlePlayerReady(client);
            break;

          case SocketEvents.PLAYER_ACTION:
            gameManager.performPlayerAction(
              client,
              message.data as PlayerAction
            );
            break;

          case SocketEvents.SET_GAME_SETTINGS: {
            const { settings, gameId } = message.data as {
              settings: GameSettings;
              gameId?: string;
            };
            gameManager.setGameSettings(client, gameId, settings);
            break;
          }

          case SocketEvents.MESSAGE: {
            const { message: messageText, timestamp } =
              message.data as MessagePayload;
            logger.info(
              `Received message: ${client.id} ${messageText} ${timestamp}`
            );
            break;
          }

          default:
            logger.warn(`Unknown event: ${message.event}`);
        }
      } catch (error) {
        logger.error("Error processing message:", error);
        client.emitToPlayer(SocketEvents.ERROR, {
          message: "Error processing message",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    socket.on("close", () => {
      logger.info(`A user disconnected: ${client.id}`);
      gameManager.handleDisconnect(client);
      gameManager.getMessageServer().unregister(client);
    });

    socket.on("error", (error: Error) => {
      logger.error("WebSocket error:", error);
      client.emitToPlayer(SocketEvents.ERROR, {
        message: "WebSocket error",
        error: error.message,
      });
    });
  });
}
