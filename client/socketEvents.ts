/**
 * @file shared/socketEvents.ts
 * @description Centralizes all socket event names and their corresponding types.
 */

import { GameSettings, GameState, LobbyState, PlayerAction, PlayerActionResult } from './types';

/**
 * Enum of all socket event names.
 */
export enum SocketEvents {
  // Connection Events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',

  // In-Lobby Events
  SET_PLAYER_NAME = 'setPlayerName',
  LOBBY_UPDATE = 'lobbyUpdate',

  // Game Events
  JOIN_GAME = 'joinGame', // Used by client to join a game
  LEAVE_GAME = 'leaveGame', // Used by client to leave a game
  GAME_UPDATE = 'gameUpdate', // Used by server to update the game state
  GAME_VOTE = 'gameVote', // Used by client to vote to start the game

  // Player Actions
  PLAYER_ACTION = 'playerAction',
  PLAYER_ACTION_RESULT = 'playerActionResult',
  PLAYER_TIMEOUT = 'playerTimeout',
  PLAYER_PLAY_CARD = 'playerPlayCard',

  // Settings
  SET_GAME_SETTINGS = 'setGameSettings', // Used by client to set game settings
  GET_GAME_SETTINGS = 'getGameSettings', // Used by client to get game settings

  // Error Handling
  ERROR = 'error', // Used by server to send an error message to the client
}

/**
 * Payload types for each socket event.
 */
export interface SocketPayloads {
  [SocketEvents.SET_PLAYER_NAME]: string;
  [SocketEvents.LOBBY_UPDATE]: LobbyState;

  [SocketEvents.JOIN_GAME]: { gameId: string; playerName: string };
  [SocketEvents.LEAVE_GAME]: void;

  [SocketEvents.GAME_UPDATE]: GameState;
  [SocketEvents.GAME_VOTE]: void;

  [SocketEvents.PLAYER_ACTION]: PlayerAction;
  [SocketEvents.PLAYER_ACTION_RESULT]: PlayerActionResult;

  [SocketEvents.SET_GAME_SETTINGS]: GameSettings;
  [SocketEvents.GET_GAME_SETTINGS]: void;

  [SocketEvents.ERROR]: string;
}
