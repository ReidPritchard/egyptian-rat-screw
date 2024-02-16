import { Card } from "../card";
import { Player } from "../player";
import { SlapEffect, SlapRule } from "../slap-rule";

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
  type: "lobby";

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
  type: "join-game";

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
  type: "player-joined";

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
  type: "player-left";

  /**
   * The name of the player that left the game.
   */
  name: string;
}

/**
 * The payload for when a user has started a game.
 */
export interface GameStartedPayload extends BasePayload {
  type: "game-started";

  /**
   * The slap rules for the game.
   */
  slapRules: SlapRule[];

  /**
   * The number of cards in your hand.
   */
  handSize: number;

  /**
   * The list of players in the game.
   * This should be in the order of play.
   */
  players: Player["name"][];

  /**
   * The scores of the players in the game.
   */
  scores: Map<Player["name"], number>;
}

/**
 * The payload for when a player wants to slap the pile.
 * The player sends this to the server, then the server
 * sends a `slap` payload to all players with the name of the player
 * and if the slap was successful.
 */
export interface SlapPayload extends BasePayload {
  type: "slap";

  /**
   * The name of the player that slapped the pile.
   */
  name: string;

  /**
   * If the slap was successful.
   * The client should not send this field.
   */
  successful: boolean;

  /**
   * The effects of the slap.
   * The client should not send this field.
   */
  effect: SlapEffect;
}

/**
 * The payload for when a player wants to play a card.
 * The player sends this to the server, then the server
 * sends a `play-card` payload to all players with the name of the player.
 */
export interface PlayCardPayload extends BasePayload {
  type: "play-card";

  /**
   * The name of the player that played the card.
   */
  name: string;

  /**
   * The card that the player played.
   * The client should not send this field as the server will
   * determine the card to play.
   */
  card: Card;
}

/**
 * The payload for an error.
 * This is sent to the client when an error occurs.
 */
export interface ErrorPayload extends BasePayload {
  type: "error";

  /**
   * The error message.
   */
  message: string;
}

export type DataPayload =
  | LobbyPayload
  | JoinGamePayload
  | PlayerJoinedPayload
  | PlayerLeftPayload
  | GameStartedPayload
  | SlapPayload
  | PlayCardPayload
  | ErrorPayload;
