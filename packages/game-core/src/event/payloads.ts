import { Card } from '../card';
import { Player } from '../player';
import { SlapEffect, SlapRule } from '../rule/slap-rule';
import { ErrorCodes } from './errors';

/**
 * Payloads are the data passed between the client and server.
 * They are used to communicate game state changes and other events.
 */
export interface BasePayload {
  /**
   * The type of the payload.
   */
  type: string;
}

/**
 * The payload when the user is not in a game.
 * This is used to display the lobby screen.
 */
export interface LobbyPayload extends BasePayload {
  type: 'lobby';

  /**
   * The list of games that the user can join.
   */
  games: {
    id: string;
    name: string;
    playerCount: number;
    maxPlayers: number;
  }[];
}

/**
 * The payload for when a user wants to join a game.
 * Use the `gameId` to join the game.
 * If the game is full, the server will respond with a `lobby` payload.
 * If the game does not exist, the server will respond with a `lobby` payload.
 *
 * The client should also provide a `name` query parameter to join the game.
 */
export interface JoinGamePayload extends BasePayload {
  type: 'join-game';

  /**
   * The id of the game to join.
   */
  gameId: string;

  /**
   * The name of the player joining the game.
   */
  name: string;
}

/**
 * The payload for when a user has joined a game.
 * This payload is sent to all players in the game when a new player joins.
 */
export interface PlayerJoinedPayload extends BasePayload {
  type: 'player-joined';

  /**
   * The name of the player that joined the game.
   */
  name: string;
}

/**
 * The payload for when a user has left a game.
 * This payload is sent to all players in the game when a player leaves.
 */
export interface PlayerLeftPayload extends BasePayload {
  type: 'player-left';

  /**
   * The name of the player that left the game.
   */
  name: string;
}

export interface PlayerReadyPayload extends BasePayload {
  type: 'player-ready';
  name: string;
  isReady: boolean;
}

export interface GameStartedPayload extends BasePayload {
  type: 'game-started';
  startTime: string;
}

export interface GameStatusPayload extends BasePayload {
  type: 'game-status';

  players: Partial<Player>[];
  scores: { [playerName: string]: number };
  currentPlayer: string;
  handSize: number;
  slapRules: SlapRule[];
  pile: Card[];
}

/**
 * The payload for when a player attempts to slap the pile.
 * The player sends this to the server.
 */
export interface SlapAttemptPayload extends BasePayload {
  type: 'slap-attempt';

  /**
   * The name of the player that attempted to slap the pile.
   */
  name: string;
}

/**
 * The payload for when the server responds to a slap attempt.
 * The server sends this to all players with the name of the player
 * and if the slap was successful.
 */
export interface SlapResultPayload extends BasePayload {
  type: 'slap-result';

  /**
   * The name of the player that slapped the pile.
   */
  name: string;

  /**
   * If the slap was successful.
   */
  successful: boolean;

  /**
   * The effects of the slap.
   */
  effect: SlapEffect;
}

/**
 * The payload for when a player wants to play a card.
 * The player sends this to the server.
 */
export interface PlayCardAttemptPayload extends BasePayload {
  type: 'play-card-attempt';

  /**
   * The name of the player that wants to play the card.
   */
  name: string;
}

/**
 * The payload for when the server responds to a play card attempt.
 * The server sends this to all players with the name of the player and the card played.
 */
export interface PlayCardResultPayload extends BasePayload {
  type: 'play-card-result';

  /**
   * The name of the player that played the card.
   */
  name: string;

  /**
   * The card that the player played.
   */
  card: Card;
}

/**
 * The payload for an error.
 * This is sent to the client when an error occurs.
 */
export interface ErrorPayload extends BasePayload {
  type: 'error';

  /**
   * The error message.
   */
  message: string;

  /**
   * The error code.
   * This can be used to determine the type of error
   * and how it's handled on the client.
   */
  errorCode: (typeof ErrorCodes)[keyof typeof ErrorCodes];

  /**
   * Additional details about the error.
   */
  details?: any;
}

export type ClientPayload =
  | JoinGamePayload
  | SlapAttemptPayload
  | PlayerReadyPayload
  | PlayCardAttemptPayload;

export type ServerPayload =
  | LobbyPayload
  | PlayerJoinedPayload
  | PlayerLeftPayload
  | GameStartedPayload
  | GameStatusPayload
  | SlapResultPayload
  | PlayCardResultPayload
  | ErrorPayload;

export type DataPayload = ClientPayload | ServerPayload;

/**
 * Function to determine if a payload a valid `DataPayload`.
 */
export function isDataPayload(payload: unknown): payload is DataPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const { type } = payload as { type: unknown };
  return typeof type === 'string';
}

/**
 * Function to determine if a payload is a valid `ClientPayload`.
 */
export function isClientPayload(payload: unknown): payload is ClientPayload {
  if (!isDataPayload(payload)) {
    return false;
  }
  return (
    payload.type === 'join-game' ||
    payload.type === 'slap-attempt' ||
    payload.type === 'player-ready' ||
    payload.type === 'play-card-attempt'
  );
}

/**
 * Function to determine if a payload is a valid `ServerPayload`.
 */
export function isServerPayload(payload: unknown): payload is ServerPayload {
  if (!isDataPayload(payload)) {
    return false;
  }
  return (
    payload.type === 'lobby' ||
    payload.type === 'player-joined' ||
    payload.type === 'player-left' ||
    payload.type === 'game-started' ||
    payload.type === 'game-status' ||
    payload.type === 'slap-result' ||
    payload.type === 'play-card-result' ||
    payload.type === 'error'
  );
}
