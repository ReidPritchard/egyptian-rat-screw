import expressWs from "express-ws";
import { isClientPayload, isDataPayload } from "@oers/game-core";
import type {
  ServerPayload,
  type DataPayload,
  type GameStartedPayload,
  type Player,
  type ERSGame,
  type ClientPayload,
  GameStatusPayload,
} from "@oers/game-core";
import { info, debug } from "@oers/utils";
import { Router } from "express";
import app, { gameManager } from "./server";

expressWs(app);

const router = Router();

router.ws("/games", (ws: WebSocket, _req) => {
  ws.send(
    JSON.stringify({
      type: "lobby",
      games: gameManager.getGameSessions(),
    })
  );

  ws.addEventListener("close", () => {
    info("WebSocket disconnected");
    ws.close();
  });
});

router.ws("/games/:id", (ws: WebSocket, req) => {
  const gameId = req.params.id;
  const playerName: string = req.query.playerName as string;

  info(`WebSocket connected to game ${gameId} as ${playerName}`);

  const game = gameManager.setPlayer(playerName, ws, gameId);

  if (!game) {
    info("Game not found");
    ws.send(JSON.stringify({ type: "error", message: "Game not found" }));
    ws.close();
    return;
  }

  info("Game found");
  const gameInitPayload: GameStatusPayload = getGameState(game, playerName);
  debug("Sending game state to player", gameInitPayload);
  ws.send(JSON.stringify(gameInitPayload));

  ws.onmessage = (event: MessageEvent<string>) => {
    let payload: ClientPayload;
    try {
      payload = JSON.parse(event.data);
    } catch (error) {
      info("Invalid payload", event.data);
      ws.send(JSON.stringify({ type: "error", message: "Invalid payload" }));
      return;
    }

    if (isDataPayload(payload) && isClientPayload(payload)) {
      const { type } = payload;

      info("Received payload type", type);

      let response: ServerPayload;
      switch (type) {
        case "player-ready":
          try {
            game.startGame();
            response = {
              type: "game-started",
              startTime: new Date().toISOString(),
            };
            gameManager.broadcastToSession(gameId, JSON.stringify(response));
            gameManager.broadcastToSession(
              gameId,
              JSON.stringify(getGameState(game, playerName))
            );
          } catch (error) {
            info("Error starting game", error);
            ws.send(
              JSON.stringify({ type: "error", message: "Error starting game" })
            );
          }
          break;
        case "play-card-attempt":
          try {
            const card = game.playCard(game.getPlayer(playerName));
            if (card) {
              response = {
                type: "play-card-result",
                name: playerName,
                card,
              };
              gameManager.broadcastToSession(gameId, JSON.stringify(response));
            }
          } catch (error) {
            info("Error playing card", error);
            ws.send(
              JSON.stringify({ type: "error", message: "Error playing card" })
            );
          }
          break;
        default:
          ws.send(JSON.stringify({ type: "error", message: "Invalid action" }));
      }
    }
  };

  ws.onerror = (error) => {
    info("WebSocket error", error);
  };

  ws.onclose = () => {
    info("WebSocket disconnected");
    if (game) {
      gameManager.removePlayer(playerName, gameId);
    }
  };
});

function getGameState(game: ERSGame, name: string): GameStatusPayload {
  const players = game.players.map((player: Player) => player.name);
  const scores = game.score;
  // const pile = game.pile;
  const handSize =
    game.players.find((player: Player) => player.name === name)?.hand.length ||
    0;
  const slapRules = game.slapRules;
  const currentPlayer = game.players[game.currentPlayerIndex].name;
  //   const active = true;

  return {
    type: "game-status",
    players,
    scores: Object.fromEntries(scores),
    handSize,
    slapRules,
    pile: [],
    currentPlayer,
  };
}

export default router;
