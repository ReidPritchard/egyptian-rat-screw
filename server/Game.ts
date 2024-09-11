import { Deck } from './Deck';
import { v4 as uuidv4 } from 'uuid';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
    id: string;
    suit: Suit;
    rank: Rank;
}

export class Game {
    id: string;
    players: string[];
    deck: Deck;
    pile: Card[];
    currentPlayer: number;
    slapRules: ((pile: Card[]) => boolean)[];
    playerHands: Map<string, Card[]>;

    constructor(players: string[]) {
        this.id = uuidv4();
        this.players = players;
        this.deck = new Deck();
        this.pile = [];
        this.currentPlayer = 0;
        this.slapRules = [
            (pile) => pile.length >= 2 && pile[0].rank === pile[1].rank, // Double
            (pile) => pile.length >= 3 && pile[0].rank === pile[2].rank, // Sandwich
            (pile) => pile.length >= 2 && ['J', 'Q', 'K', 'A'].includes(pile[0].rank), // Face card
        ];
        this.playerHands = new Map();
        this.dealCards();
    }

    private dealCards(): void {
        this.deck.shuffle();
        const hands = this.deck.deal(this.players.length);
        this.players.forEach((player, index) => {
            this.playerHands.set(player, hands[index]);
        });
    }

    playCard(playerId: string): void {
        if (playerId !== this.players[this.currentPlayer]) {
            throw new Error('Not your turn');
        }

        const playerHand = this.playerHands.get(playerId);
        if (!playerHand || playerHand.length === 0) {
            throw new Error('No cards left to play');
        }

        const card = playerHand.pop()!;
        this.pile.unshift(card);

        this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
        this.updateState();
    }

    checkSlap(playerId: string): boolean {
        const isValidSlap = this.slapRules.some(rule => rule(this.pile));

        if (isValidSlap) {
            const playerHand = this.playerHands.get(playerId);
            if (playerHand) {
                playerHand.push(...this.pile);
                this.pile = [];
            }
        } else {
            // Penalty: move a card from the player's hand to the bottom of the pile
            const playerHand = this.playerHands.get(playerId);
            if (playerHand && playerHand.length > 0) {
                const penaltyCard = playerHand.pop()!;
                this.pile.push(penaltyCard);
            }
        }

        this.updateState();
        return isValidSlap;
    }

    updateState(): void {
        // Check for game over condition
        const activePlayers = this.players.filter(player => {
            const hand = this.playerHands.get(player);
            return hand && hand.length > 0;
        });

        if (activePlayers.length === 1) {
            console.log(`Game over! ${activePlayers[0]} wins!`);
            // TODO: Implement game over logic (e.g., emit event to clients)
        }

        // TODO: Emit updated game state to clients
    }

    getGameState() {
        return {
            id: this.id,
            players: this.players,
            currentPlayer: this.currentPlayer,
            pileSize: this.pile.length,
            topCard: this.pile[0] || null,
            playerHandSizes: Object.fromEntries(
                Array.from(this.playerHands.entries()).map(([player, hand]) => [player, hand.length])
            ),
            gameOver: this.players.length === 1
        };
    }

    addPlayer(playerId: string): void {
        if (this.players.length < 4 && !this.players.includes(playerId)) {
            this.players.push(playerId);
            this.playerHands.set(playerId, []);
            this.dealCards();
        }
    }

    removePlayer(playerId: string): void {
        const index = this.players.indexOf(playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
            this.playerHands.delete(playerId);
            if (this.currentPlayer >= this.players.length) {
                this.currentPlayer = 0;
            }
            this.updateState();
        }
    }
}