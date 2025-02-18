/**
 * @file shared/types.ts
 * @description Consolidates all shared TypeScript types for both client and server.
 */

export const Suits = ["hearts", "diamonds", "clubs", "spades"] as const;
export type Suit = (typeof Suits)[number];

export const Ranks = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
] as const;
export type Rank = (typeof Ranks)[number];

export interface Card {
  id: string;
  code: string;
  suit: Suit;
  rank: Rank;
}

export enum PlayerActionType {
  START_VOTE = "start-vote",
  CAST_VOTE = "cast-vote",
  SET_READY = "set-ready",
  SET_SETTINGS = "set-settings",
}

export interface PlayerAction {
  playerId: string;
  actionType: PlayerActionType;
  timestamp: number;
  data: {
    vote?: boolean;
    voteTopic?: string;
    ready?: boolean;
    settings?: GameSettings;
  };
}

// Types of events that occur during the game, used for logging
// and to calculate game statistics
export enum GameEventType {
  ADD_PLAYER = "ADD_PLAYER",
  REMOVE_PLAYER = "REMOVE_PLAYER",
  START_GAME = "START_GAME",
  END_GAME = "END_GAME",
  PLAY_CARD = "PLAY_CARD",
  VALID_SLAP = "VALID_SLAP",
  INVALID_SLAP = "INVALID_SLAP",
  START_CHALLENGE = "START_CHALLENGE",
  COUNTER_FACE_CARD_CHALLENGE = "COUNTER_FACE_CARD_CHALLENGE",
  WIN_FACE_CARD_CHALLENGE = "WIN_FACE_CARD_CHALLENGE",
  LOSE_FACE_CARD_CHALLENGE = "LOSE_FACE_CARD_CHALLENGE",
  ADVANCE_TURN = "ADVANCE_TURN",
  SET_READY = "SET_READY",
  SET_SETTINGS = "SET_SETTINGS",
  START_VOTE = "START_VOTE",
  SUBMIT_VOTE = "SUBMIT_VOTE",
  RESOLVE_VOTE = "RESOLVE_VOTE",
}

export interface GameEvent {
  playerId: string;
  eventType: GameEventType;
  timestamp: number;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  data: any;
}

export interface ICondition {
  field: ConditionValue;
  operator: "===" | "!==" | ">" | "<" | ">=" | "<=" | "in";
  value: ConditionValue;
}

export interface IDynamicValue {
  value: string;
  isDynamic: true;
}

export interface IStaticValue {
  value: string | number | string[];
  isDynamic: false;
}

export type ConditionValue = IDynamicValue | IStaticValue;

export enum SlapRuleAction {
  TAKE_PILE = "take-pile",
  SKIP = "skip",
  DRINK = "drink",
  DRINK_ALL = "drink-all",
}

export interface SlapRule {
  // The name of the rule (used so users know why it was valid/invalid)
  name: string;
  // The conditions that must be met for the rule to be triggered
  conditions: ICondition[];
  // The action to be taken when the rule is triggered
  // The action can be negative or positive, depending on the context
  // a positive action is applied to the slapper, while a negative action is applied to the target player
  // skip: The target player must skip their next turn
  // drink: The target player must take a drink
  // take-pile: The slapper gets to take all the cards in the pile
  action: SlapRuleAction;
  // The name of the player to be targeted by the rule
  targetPlayerName?: string;
}

export interface PlayerActionResult {
  playerId: string;
  actionType: PlayerActionType;
  result: "success" | "failure";
  message?: string;
  timestamp: number;
}

export interface GameSettings {
  minimumPlayers: number;
  maximumPlayers: number;
  slapRules: SlapRule[];
  faceCardChallengeCounts: { [key: string]: number };
  challengeCounterCards: Partial<Card>[]; // Partial<Card> allows for a Card object with missing properties, which are treated as wild for the purpose of matching
  turnTimeout: number;
  /**
   * The amount of time a "completed" challenge can be slapped before
   * the game will automatically count the challenge as successful
   *
   * This allows any player to slap before the cards are removed due to the
   * resolved challenge.
   */
  challengeCounterSlapTimeout: number;
}

export interface PlayerInfo {
  id: string;
  name: string;
  isBot: boolean;
}

export type PlayerInfoUpdate = PlayerInfo & {
  action: "join" | "leave" | "update";
};

export interface GameState {
  id: string;
  name: string;
  stage: GameStage;
  maxPlayers: number;
  players: PlayerInfo[];
  currentPlayer: number;
  pileSize: number;
  pile: Card[] | null;
  playerHandSizes: { [playerId: string]: number };
  playerNames: { [playerId: string]: string };
  winner: PlayerInfo | null;
  slapRules: SlapRule[];
}

export enum GameStage {
  PRE_GAME = "pre-game",
  PLAYING = "playing",
  GAME_OVER = "game-over",
  RESTARTING = "restarting",
  VOTING = "voting",
  CANCELLED = "cancelled",
}

// A subset of GameState that is sent to the client
// This is used to reduce the amount of data sent to the client
// and to prevent the client from having full access to the game state
export interface ClientGameState {
  gameId: string;
  stage: GameStage;
  players: Array<{
    id: string;
    name: string;
    cardCount: number;
    isBot: boolean;
    isReady: boolean;
  }>;
  currentPlayerId: string;
  centralPileCount: number;
  topCards: Card[];
  faceCardChallenge: {
    challenger: PlayerInfo;
    currentPlayerId: string;
    remainingPlays: number;
  } | null;
  winner: PlayerInfo | null;
  voteState: VoteState | null;
  settings: GameSettings;
  eventLog: GameEvent[];
}

export interface LobbyState {
  games: {
    id: string;
    name: string;
    playerCount: number;
    maxPlayers: number;
  }[];
}

export interface Vote {
  playerId: string;
  vote: boolean;
}

export interface VoteState {
  topic: string;
  votes: Vote[];
  startTime: number;
}

export interface CardChallenge {
  active: boolean;
  challenger: PlayerInfo;
  challenged: PlayerInfo;
  remainingCounterChances: number;
  result: "challenger" | "counter" | null;
}
