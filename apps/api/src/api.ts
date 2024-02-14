import { log } from "@repo/logger";
import app from "./server";
import express from "express";
import expressWs from "express-ws";
import { EgyptianRatScrew } from "@repo/eg-rat-screw-game";

expressWs(app);

const GameLobbies = new Map<string, EgyptianRatScrew>();

const router = express.Router();

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
router.ws("/game/:id", (ws, req) => {
  const gameId = req.params.id;
  const game = GameLobbies.get(gameId);
  if (!game) {
    ws.send("Game not found");
    ws.close();
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

  const player = game.players.find((player) => player.name === name);
  if (!player) {
    ws.send("Player not found");
    ws.close();
    return;
  }

  // Send the player's current client state
  ws.send(game.playerStatus(player));

  // Setup the WebSocket event listeners
  ws.on("slap", () => {
    ws.emit("slap");
    const didSlap = game.slapPile(player);
    ws.send(didSlap ? "You slapped the pile!" : "You missed the pile!");
  });

  ws.on("playCard", () => {
    game.playCard(player);
  });

  ws.on("disconnect", () => {
    game.players = game.players.filter((p) => p.name !== name);
  });
});

export default router;
