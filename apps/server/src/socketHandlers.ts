import type { WebSocketServer, WebSocket } from "ws";
import { GameManager } from "./GameManager.js";
import { newLogger } from "./logger.js";
import {
  type MessagePayload,
  SocketEvents,
  type SocketPayloads,
} from "@oer/shared";
import type { GameSettings, PlayerAction } from "@oer/shared";
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
    let client: Messenger | undefined;

    logger.info("Setting up socket handlers");
    socket.on("message", (data: string) => {
      logger.info(`Received message: ${data}`);

      try {
        const message: WebSocketMessage = JSON.parse(data);
        logger.info(
          `REQUEST: ${message.event} ${JSON.stringify(message.data)}`
        );

        // Handle connection_init first
        if (message.event === "connection_init") {
          if (client) {
            logger.warn(
              "Received connection_init for already initialized client"
            );
            return;
          }
          logger.info("Received connection_init event");
          client = new Messenger(false, socket);
          logger.info(`Created client: ${client.id}`);

          gameManager.getMessageServer().register(client);

          logger.info("Adding player to lobby");
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
          return;
        }

        // Require client to be initialized for all other messages
        if (!client) {
          logger.error("Received message before connection_init");
          socket.send(
            JSON.stringify({
              event: SocketEvents.ERROR,
              data: "Connection not initialized",
            })
          );
          return;
        }

        switch (message.event) {
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
        client?.emitToPlayer(SocketEvents.ERROR, {
          message: "Error processing message",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    socket.on("close", () => {
      logger.info(`A user disconnected: ${client?.id}`);
      if (client) {
        gameManager.handleDisconnect(client);
        gameManager.getMessageServer().unregister(client);
      }
    });

    socket.on("error", (error: Error) => {
      logger.error("WebSocket error:", error);
      client?.emitToPlayer(SocketEvents.ERROR, {
        message: "WebSocket error",
        error: error.message,
      });
    });
  });
}
