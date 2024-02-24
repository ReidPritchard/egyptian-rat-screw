import { Router } from "express";
import { getGameManager } from "@oers/game-core";
import { MODE } from "./server";

const gameManager = getGameManager<WebSocket>(MODE);
const GameLobbies = gameManager.gameSessions;

const router = Router();

/**
 * Get a list of all game lobbies
 * @returns gameId[]
 */
router.get("/games", (req, res) => {
  res.json(Array.from(gameManager.getGameSessions()));
});

/**
 * Create a new game lobby
 * @returns gameId
 */
router.post("/games", (req, res) => {
  const gameId = gameManager.createSession();
  res.json({ gameId });
});

export default router;
