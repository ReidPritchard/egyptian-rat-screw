export interface DB {
  games: { [key: string]: Game };
  players: { [key: string]: Player };
}

// TODO: Narrow down the types of the following IDs
type SlapRuleId = string;
type PenaltyRuleId = string;

export interface Game {
  gameId: string;

  players: string[]; // playerIds
  currentPlayer: number;
  currentChances: number;

  centralPile: Card[];
  playerHands: { [key: string]: Card[] };

  slapRules: SlapRuleId[];
  slapPenalty: PenaltyRuleId;

  gameState: 'waiting' | 'playing' | 'finished';
}

enum Suit {
  Hearts,
  Diamonds,
  Clubs,
  Spades,
}

enum Rank {
  Two = 2,
  Three,
  Four,
  Five,
  Six,
  Seven,
  Eight,
  Nine,
  Ten,
  Jack,
  Queen,
  King,
  Ace,
}

export interface Card {
  cardId: string;

  rank: Rank;
  suit: Suit;
}

export interface Player {
  playerId: string;
  username: string;
  connected: boolean;
  ready: boolean;
}

export interface SlapRule {
  id: string;
  description: string;
  isSlappable: (pile: Card[], recentCard: Card) => boolean;
}

export interface PenaltyRule {
  id: string;
  description: string;
  applyPenalty: (player: Player, pile: Card[]) => void;
}
