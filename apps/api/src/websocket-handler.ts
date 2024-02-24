import expressWs from "express-ws";
import type { DataPayload, GameStartedPayload, Player } from "@oers/game-core";
import { ERSGame } from "@oers/game-core";
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
  const gameInitPayload: GameStartedPayload = getGameState(game, playerName);
  debug("Sending game state to player", gameInitPayload);
  ws.send(JSON.stringify(gameInitPayload));

  ws.onmessage = (event) => {
    let payload;
    try {
      payload = JSON.parse(event.data) as DataPayload;
    } catch (error) {
      info("Invalid payload", event.data);
      return;
    }

    const { type } = payload;

    info("Payload type", type);
    ws.send(JSON.stringify({ type: "error", message: "Invalid action" }));

    // switch (type) {
    //   case "join-game": {
    //     const { name } = payload;

    //     const alreadyJoined =
    //       game?.players.find((player: Player) => player.name === name) !==
    //       undefined;
    //     if (alreadyJoined) {
    //       const allPlayers = game?.players.map((player: Player) => player.name);
    //       debug("Player already joined", allPlayers?.join(", "));
    //       return;
    //     }

    //     game = createGame(gameId, name, ws, gameName);

    //     debug("Sending player-joined event to all players except", name);
    //     GameClients.get(gameId)?.forEach((client) => {
    //       if (client !== ws) {
    //         client.send(
    //           JSON.stringify({
    //             type: "player-joined",
    //             name,
    //           })
    //         );
    //       } else {
    //         // Send the game state to the player who joined
    //         const gameState = game ? getGameState(game, name) : undefined;
    //         const response = JSON.stringify(gameState);
    //         ws.send(response);
    //       }
    //     });
    //     break;
    //   }
    //   case "game-started": {
    //     debug("Game started by player", playerName);
    //     if (playerName === undefined || game?.gameActive) {
    //       debug(
    //         playerName === undefined ? "No player name" : "Game already active"
    //       );
    //       return;
    //     }

    //     game?.startGame();

    //     // Send the game state to all players
    //     const gameState = game ? getGameState(game, playerName) : undefined;
    //     const response = JSON.stringify(gameState);
    //     GameClients.get(gameId)?.forEach((client) => {
    //       client.send(response);
    //     });
    //     break;
    //   }
    //   case "play-card": {
    //     // The card won't be in the payload as the client doesn't know their hand
    //     const player = game?.players.find((p: Player) => p.name === playerName);
    //     if (player) {
    //       const card = game?.playCard(player);
    //       // Send the play-card event to all players
    //       const response: PlayCardPayload = {
    //         type: "play-card",
    //         name: playerName ?? "",
    //         card,
    //       };
    //       GameClients.get(gameId)?.forEach((client) => {
    //         client.send(JSON.stringify(response));
    //       });
    //     }
    //     break;
    //   }
    //   default:
    //     break;
    // }
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

/**
 * If the game doesn't exist, create a new game with the provided player name.
 * @param gameId - The ID of the game.
 * @param playerName - The name of the player.
 * @returns The game that was created.
 */
function createGame(
  gameId: string,
  playerName: string,
  webSocket: WebSocket,
  _gameName?: string // TODO: Improve support for game names
): ERSGame {
  let game = GameLobbies.get(gameId);
  if (!game) {
    game = new ERSGame([]);
    GameLobbies.set(gameId, game);
  }
  // If the game already exists, track the new client
  // if it doesn't already exist, create a new game and track the client
  GameClients.set(gameId, [...(GameClients.get(gameId) ?? []), webSocket]);
  game.players.push({
    name: playerName,
    hand: [],
  });
  return game;
}

function getGameState(game: ERSGame, name: string): GameStartedPayload {
  const players = game.players.map((player: Player) => player.name);
  const scores = game.score;
  //   const pile = game.pile;
  const handSize =
    game.players.find((player: Player) => player.name === name)?.hand.length ||
    0;
  const slapRules = game.slapRules;
  //   const currentPlayer = game.players[game.currentPlayerIndex].name;
  //   const active = true;

  return {
    type: "game-started",
    players,
    scores,
    handSize,
    slapRules,
  };
}

export default router;
