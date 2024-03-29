import expressWs from 'express-ws';
import { ErrorCodes, isClientPayload, isDataPayload } from '@oers/game-core';
import type {
  ServerPayload,
  ClientPayload,
  PlayerStatus,
} from '@oers/game-core';
import { info, debug } from '@oers/utils';
import { Router } from 'express';
import app, { gameManager } from './server';

expressWs(app);

const router = Router();

router.ws('/games', (ws: WebSocket, _req) => {
  ws.send(
    JSON.stringify({
      type: 'lobby',
      games: gameManager.getGameSessions(),
    })
  );

  ws.addEventListener('close', () => {
    info('WebSocket disconnected');
    ws.close();
  });
});

router.ws('/games/:id', (ws: WebSocket, req) => {
  const gameId = req.params.id;
  const playerName: string = req.query.playerName as string;

  info(`WebSocket connected to game ${gameId} as ${playerName}`);

  const game = gameManager.setPlayer(playerName, ws, gameId);

  if (!game) {
    info('Game not found');
    // ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
    sendError(ws, 'Game not found', ErrorCodes.NOT_FOUND);
    ws.close();
    return;
  }

  info('Game found');

  ws.onmessage = (event: MessageEvent<string>) => {
    let payload: ClientPayload;
    let response: ServerPayload;

    try {
      payload = JSON.parse(event.data) as ClientPayload;
    } catch (error) {
      info('Invalid JSON format', event.data);
      sendError(ws, 'Invalid JSON format', ErrorCodes.INVALID_INPUT);
      return;
    }

    if (!isClientPayload(payload)) {
      info('Invalid payload', event.data);
      sendError(ws, 'Invalid payload', ErrorCodes.INVALID_INPUT);
      return;
    }

    const { type } = payload;

    info('Received payload type', type);
    switch (type) {
      case 'player-ready': {
        const didStatusChange: boolean = game.updatePlayerStatus(
          playerName,
          payload.isReady ? 'ready' : 'waiting'
        );
        if (didStatusChange) {
          gameManager.broadcastGameStateToSession(gameId);
        }

        // Try to start the game if all players are ready
        try {
          game.startGame();
          response = {
            type: 'game-started',
            // The start time should be ~10 seconds from now
            startTime: new Date(Date.now() + 10000).toISOString(),
          };
          gameManager.broadcastToSession(gameId, JSON.stringify(response));
          gameManager.broadcastGameStateToSession(gameId);
        } catch (error) {
          info('Error starting game', error);
          sendError(ws, 'Error starting game', ErrorCodes.GAME_START_FAILED);
        }
        break;
      }
      case 'play-card-attempt':
        try {
          const card = game.playCard(game.getPlayer(playerName));
          if (card) {
            response = {
              type: 'play-card-result',
              name: playerName,
              card,
            };
            gameManager.broadcastToSession(gameId, JSON.stringify(response));
          }
        } catch (error) {
          info('Error playing card', error);
          sendError(
            ws,
            'Error playing card',
            ErrorCodes.PLAY_CARD_ACTION_FAILED
          );
        }
        break;
      default:
        debug('Invalid action', type);
        sendError(ws, 'Invalid action', ErrorCodes.UNSUPPORTED_ACTION);
    }
  };

  ws.onerror = (error) => {
    info('WebSocket error', error);
  };
  ws.onclose = () => {
    handleDisconnect(playerName, gameId);
  };
});

function sendError(ws: WebSocket, message: string, errorCode: ErrorCodes) {
  const response: ServerPayload = {
    type: 'error',
    message,
    errorCode,
  };
  ws.send(JSON.stringify(response));
}

function handleDisconnect(playerName: string, gameId: string) {
  info(`WebSocket disconnected for player ${playerName} in game ${gameId}`);
  gameManager.removePlayer(playerName, gameId);
}

export default router;
