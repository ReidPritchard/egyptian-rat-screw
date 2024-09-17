export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface Player {
  id: string;
  name: string;
}

export interface SlapRule {
  name: string;
  conditions: Condition[];
}

export interface Condition {
  field: string | number;
  operator: '===' | '!==' | '>' | '<' | '>=' | '<=' | 'in';
  value: string | number | string[];
}
