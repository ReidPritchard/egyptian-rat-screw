import { Router } from 'express';
import { debug } from '@oers/utils';
import { gameManager } from './server';

const router = Router();

/**
 * Get a list of all game lobbies
 * @returns gameId[]
 */
router.get('/games', (req, res) => {
  res.json(Array.from(gameManager.getGameSessions()));
});

/**
 * Create a new game lobby
 * @returns gameId
 */
router.post('/games', (req, res) => {
  const gameId = gameManager.createSession();
  res.json({ gameId });
});

/**
 * Join a game lobby
 * @param gameId - The ID of the game lobby to join.
 * @param playerName - The name of the player joining the game.
 */
router.post('/games/:gameId/join', (req, res) => {
  const { gameId } = req.params;
  const playerName = req.body.playerName;
  debug('DEPRECIATED - Use WebSocket to join game', gameId, playerName);
  // gameManager.addPlayerToSession(playerName, gameId);
  res.json({ gameId });
});

export default router;
