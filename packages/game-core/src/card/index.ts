const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
export type Suit = (typeof SUITS)[number];
export type RedSuit = "hearts" | "diamonds";
export type BlackSuit = "clubs" | "spades";

const RANK = [
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
  "A",
] as const;
export type Rank = (typeof RANK)[number];
export type FaceCard = "J" | "Q" | "K" | "A";

export interface Card {
  suit: Suit;
  rank: Rank;
}

export function createDeck(): Card[] {
  let deck = [];
  for (let suit of SUITS) {
    for (let rank of RANK) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function isFaceCard(card: Card): card is { suit: Suit; rank: FaceCard } {
  return ["J", "Q", "K", "A"].includes(card.rank);
}
