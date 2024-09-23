/**
 * @file shared/socketEvents.ts
 * @description Centralizes all socket event names and their corresponding types.
 */

import {
  ClientGameState,
  GameSettings,
  LobbyState,
  PlayerAction,
  PlayerActionResult,
  PlayerInfo,
  VoteState,
} from './types';

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
  GAME_OVER = 'gameOver', // Used by server to announce the game is over

  // Player Actions
  PLAYER_ACTION = 'playerAction',
  PLAYER_ACTION_RESULT = 'playerActionResult',
  PLAYER_TIMEOUT = 'playerTimeout',

  // Settings
  SET_GAME_SETTINGS = 'setGameSettings', // Used by client to set game settings
  GET_GAME_SETTINGS = 'getGameSettings', // Used by client to get game settings

  // Error Handling
  ERROR = 'error', // Used by server to send an error message to the client

  // Voting Events
  START_VOTE = 'startVote',
  SUBMIT_VOTE = 'submitVote',
  VOTE_UPDATE = 'voteUpdate',
}

/**
 * Payload types for each socket event.
 */
export interface SocketPayloads {
  [SocketEvents.SET_PLAYER_NAME]: string;
  [SocketEvents.LOBBY_UPDATE]: LobbyState;

  [SocketEvents.JOIN_GAME]: { gameId: string; playerName: string };
  [SocketEvents.LEAVE_GAME]: void;

  [SocketEvents.GAME_UPDATE]: ClientGameState;
  [SocketEvents.GAME_OVER]: PlayerInfo;
  [SocketEvents.PLAYER_ACTION]: PlayerAction;
  [SocketEvents.PLAYER_ACTION_RESULT]: PlayerActionResult;

  [SocketEvents.SET_GAME_SETTINGS]: GameSettings;
  [SocketEvents.GET_GAME_SETTINGS]: void;

  [SocketEvents.ERROR]: string;

  // Voting Payloads
  [SocketEvents.START_VOTE]: { topic: string };
  [SocketEvents.SUBMIT_VOTE]: { vote: boolean };
  [SocketEvents.VOTE_UPDATE]: VoteState;
}
