export const Suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
export type Suit = (typeof Suits)[number];

export const Ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export type Rank = (typeof Ranks)[number];

export interface Card {
  id: string;
  code: string;
  suit: Suit;
  rank: Rank;
}

export enum PlayerActionType {
  PLAY_CARD = 'playCard',
  SLAP = 'slap',
  INVALID_SLAP = 'invalidSlap',
}
export interface PlayerAction {
  playerId: string;
  actionType: PlayerActionType;
  timestamp: number;
}

export interface PlayerActionResult {
  playerId: string;
  actionType: PlayerActionType;
  result: 'success' | 'failure';
  message?: string;
}

export interface GameSettings {
  minimumPlayers: number;
  maximumPlayers: number;
  slapRules: SlapRule[];
  faceCardChallengeCounts: { [key: string]: number };
  challengeCounterCards: Partial<Card>[]; // Partial<Card> allows for a Card object with missing properties, which are treated as wild for the purpose of matching
  turnTimeout: number;
}

export interface ICondition {
  field: 'pile.length' | 'pile[0].rank' | 'pile[1].rank' | 'currentPlayer' | 'currentPlayer.name';
  operator: '===' | '!==' | '>' | '<' | '>=' | '<=' | 'in';
  value: string | number | string[];
}

export enum SlapRuleAction {
  TAKE_PILE = 'take-pile',
  SKIP = 'skip',
  DRINK = 'drink',
  DRINK_ALL = 'drink-all',
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

export interface PlayerInfo {
  id: string;
  name: string;
}

export interface CardChallenge {
  active: boolean;
  challenger: PlayerInfo;
  challenged: PlayerInfo;
  remainingCounterChances: number;
  result: 'challenger' | 'counter' | null;
}

// A subset of GameState that is sent to the client
// This is used to reduce the amount of data sent to the client
// and to prevent the client from having full access to the game state
export interface GameState {
  name: string;
  pile: Card[] | null;
  playerIds: string[]; // Also the turn order
  playerHandSizes: { [playerId: string]: number };
  playerNames: { [playerId: string]: string };
  currentPlayerId: string;
  gameOver: boolean;
  winner: PlayerInfo | null;
  gameSettings: GameSettings;
  voteState: VoteState | null;
  cardChallenge: CardChallenge | null;
}

export interface LobbyState {
  players: PlayerInfo[];
  games: { id: string; name: string; playerCount: number; maxPlayers: number }[];
}

export interface Vote {
  playerId: string;
  vote: boolean;
}

export interface VoteState {
  topic: string;
  votes: Vote[];
  totalPlayers: number;
}
