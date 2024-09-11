import { v4 as uuidv4 } from 'uuid';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
    id: string;
    suit: Suit;
    rank: Rank;
}

export class Deck {
    cards: Card[];

    constructor() {
        this.cards = this.createDeck();
    }

    private createDeck(): Card[] {
        const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck: Card[] = [];

        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({ id: uuidv4(), suit, rank });
            }
        }

        return deck;
    }

    shuffle(): void {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(numPlayers: number): Card[][] {
        const hands: Card[][] = Array.from({ length: numPlayers }, () => []);
        let currentPlayer = 0;

        while (this.cards.length > 0) {
            const card = this.cards.pop();
            if (card) {
                hands[currentPlayer].push(card);
                currentPlayer = (currentPlayer + 1) % numPlayers;
            }
        }

        return hands;
    }
}