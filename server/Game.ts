import { Deck } from './Deck';
import { v4 as uuidv4 } from 'uuid';
import { Player } from './Lobby';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface Card {
    id: string;
    suit: Suit;
    rank: Rank;
}

export class Game {
    id: string;
    name: string;
    players: Player[];
    deck: Deck;
    pile: Card[];
    currentPlayer: number;
    slapRules: ((pile: Card[]) => boolean)[];
    playerHands: Map<string, Card[]>;
    gameOver: boolean;
    winner: Player | null;
    maxPlayers: number = 4;

    constructor(initialPlayers: Player[]) {
        this.id = uuidv4();
        this.name = this.generateGameName();
        this.players = initialPlayers;
        this.deck = new Deck();
        this.pile = [];
        this.currentPlayer = 0;
        this.slapRules = [
            (pile) => pile.length >= 2 && pile[0].rank === pile[1].rank, // Double
            (pile) => pile.length >= 3 && pile[0].rank === pile[2].rank, // Sandwich
            (pile) => pile.length >= 2 && ['J', 'Q', 'K', 'A'].includes(pile[0].rank), // Face card
        ];
        this.playerHands = new Map();
        this.gameOver = false;
        this.winner = null;
        this.dealCards();
    }

    private generateGameName(): string {
        const adjectives = ['Fierce', 'Swift', 'Clever', 'Mighty', 'Brave'];
        const nouns = ['Tigers', 'Eagles', 'Foxes', 'Lions', 'Wolves'];
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
        return `${randomAdjective} ${randomNoun}`;
    }

    private dealCards(): void {
        this.deck.shuffle();
        const hands = this.deck.deal(this.players.length);
        this.players.forEach((player, index) => {
            this.playerHands.set(player.id, hands[index]);
        });
    }

    playCard(playerId: string): void {
        const player = this.players[this.currentPlayer];
        if (playerId !== player.id) {
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
        const activePlayers = this.players.filter(player => {
            const hand = this.playerHands.get(player.id);
            return hand && hand.length > 0;
        });

        if (activePlayers.length === 1) {
            this.gameOver = true;
            this.winner = activePlayers[0];
            console.log(`Game over! ${this.winner.name} wins!`);
        }
    }

    getGameState() {
        return {
            id: this.id,
            name: this.name,
            maxPlayers: this.maxPlayers,
            players: this.players.map(p => ({ id: p.id, name: p.name })),
            currentPlayer: this.currentPlayer,
            pileSize: this.pile.length,
            pile: this.pile,
            playerHandSizes: Object.fromEntries(
                Array.from(this.playerHands.entries()).map(([playerId, hand]) => [playerId, hand.length])
            ),
            gameOver: this.gameOver,
            winner: this.winner ? { id: this.winner.id, name: this.winner.name } : null
        };
    }

    addPlayer(player: Player): void {
        if (this.players.length < this.maxPlayers && !this.players.some(p => p.id === player.id)) {
            this.players.push(player);
            this.redistributeCards();
        }
    }

    private redistributeCards(): void {
        // Collect all cards from players' hands and the pile
        let allCards: Card[] = [];
        this.playerHands.forEach(hand => {
            allCards = allCards.concat(hand);
        });
        allCards = allCards.concat(this.pile);

        // If there are no cards (new game), create a new deck
        if (allCards.length === 0) {
            this.deck = new Deck();
            allCards = this.deck.cards;
        }

        // Shuffle all cards
        this.shuffleArray(allCards);

        // Distribute cards evenly among players
        this.playerHands.clear();
        this.players.forEach(player => {
            this.playerHands.set(player.id, []);
        });

        let currentPlayerIndex = 0;
        allCards.forEach(card => {
            const currentPlayer = this.players[currentPlayerIndex];
            this.playerHands.get(currentPlayer.id)!.push(card);
            currentPlayerIndex = (currentPlayerIndex + 1) % this.players.length;
        });

        // Clear the pile
        this.pile = [];
    }

    private shuffleArray(array: any[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    removePlayer(playerId: string): void {
        const index = this.players.findIndex(p => p.id === playerId);
        if (index !== -1) {
            this.players.splice(index, 1);
            this.playerHands.delete(playerId);
            if (this.currentPlayer >= this.players.length) {
                this.currentPlayer = 0;
            }
            this.updateState();
        }
    }

    updatePlayerName(playerId: string, newName: string): void {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.name = newName;
            console.log(`Player ${playerId} updated name to ${newName}`);
        }
    }

    restartGame(): void {
        this.gameOver = false;
        this.winner = null;
        this.redistributeCards();
        this.currentPlayer = 0;
    }
}