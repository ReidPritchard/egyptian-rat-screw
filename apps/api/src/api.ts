import expressWs from "express-ws";
import { EgyptianRatScrew } from "@repo/eg-rat-screw-game";
import { Router } from "express";
import app from "./server";

expressWs(app);

const GameLobbies = new Map<string, EgyptianRatScrew>();

const router = Router();

// Setup base routes for the API
router.get("/", (req, res) => {
  res.send("Welcome to the Egyptian Rat Screw API");
});

// Setup a route to create a new game lobby
router.post("/game", (req, res) => {
  const gameId = Math.random().toString(36).substring(7);
  GameLobbies.set(gameId, new EgyptianRatScrew([]));
  res.send(gameId);
});

// // Setup a route to join a game lobby
// router.post("/game/:id", (req, res) => {
//   const gameId = req.params.id;
//   const game = GameLobbies.get(gameId);
//   if (game) {
//     game.players.push({ name: req.body.name, hand: [] });
//     res.send("Joined game");
//   } else {
//     res.status(404).send("Game not found");
//   }
// });

// Setup a WebSocket server
router.ws("/game/:id", (ws: WebSocket, req) => {
  const gameId = req.params.id;
  const game = GameLobbies.get(gameId);
  if (!game) {
    const newGameId = Math.random().toString(36).substring(7);
    GameLobbies.set(newGameId, new EgyptianRatScrew([]));
    ws.send(newGameId);
    return;
  }

  // Get the player's name from the query string
  const name = req.query.name as string;
  if (!name) {
    ws.send("Player name is required");
    ws.close();
    return;
  }

  // Add the player to the game
  game.players.push({ name, hand: [] });

  const foundPlayer = game.players.find((p) => p.name === name);
  if (!foundPlayer) {
    ws.send("Player not found");
    ws.close();
    return;
  }

  // Send the player's current client state
  ws.send(JSON.stringify(game.playerStatus(foundPlayer)));

  // Setup the WebSocket event listeners
  ws.addEventListener("message", (event: MessageEvent) => {
    if (event.data === "slap") {
      ws.send("You slapped the pile!");
    }
  });

  ws.addEventListener("message", (event: MessageEvent) => {
    if (event.data === "playCard") {
      game.playCard(foundPlayer);
    }
  });

  ws.addEventListener("close", () => {
    game.players = game.players.filter((p) => p.name !== name);
  });
});

export default router;
