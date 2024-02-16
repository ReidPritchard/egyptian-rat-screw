import expressWs from "express-ws";
import { EgyptianRatScrew } from "@repo/eg-rat-screw-game";
import { Router } from "express";
import app from "./server";

expressWs(app);

const GameLobbies = new Map<string, EgyptianRatScrew>();

const router = Router();

router.post("/games", (req, res) => {
  const gameId = Math.random().toString(36).substring(7);
  GameLobbies.set(gameId, new EgyptianRatScrew([]));
  res.json({ gameId });
});

router.ws("/games/:id", (ws: WebSocket, req) => {
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

  ws.addEventListener("close", () => {
    game.players = game.players.filter((p) => p.name !== name);
  });
});

export default router;
