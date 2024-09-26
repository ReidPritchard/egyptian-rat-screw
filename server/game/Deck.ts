import { Card, Ranks, Suits } from '../types.js';
import { Player } from './Player.js';

export class Deck {
  private static suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
  private static ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  public static createShuffledDeck(): Card[] {
    const deck: Card[] = [];

    for (const suit of Suits) {
      for (const rank of Ranks) {
        deck.push({
          id: `${rank}${suit}`,
          code: `${rank}${suit.charAt(0)}`,
          rank: rank,
          suit: suit,
        });
      }
    }

    // Shuffle the deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
  }

  public static dealCards(deck: Card[], players: Player[]) {
    while (deck.length > 0) {
      for (const player of players) {
        const card = deck.pop();
        if (card) {
          player.receiveCards([card]);
        } else {
          break;
        }
      }
    }
  }
}
