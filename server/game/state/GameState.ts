import { Player, Card, SlapRule } from '../types';
import { Deck } from '../Deck';
import { shuffleArray } from '../utils/CardUtils';

export class GameState {
  players: Player[];
  deck: Card[];
  pile: Card[];
  currentPlayer: number;
  slapRules: SlapRule[];
  playerHands: Map<string, Card[]>;
  gameOver: boolean;
  winner: Player | null;
  maxPlayers: number;
  faceCardPlayer: Player | null;
  faceCardChances: number;

  constructor(initialPlayers: Player[], maxPlayers: number, slapRules: SlapRule[]) {
    this.players = initialPlayers;
    this.deck = Deck.createShuffledDeck().map((card) => ({ ...card }));
    this.pile = [];
    this.currentPlayer = 0;
    this.maxPlayers = maxPlayers;
    this.slapRules = slapRules;
    this.playerHands = new Map();
    this.gameOver = false;
    this.winner = null;
    this.faceCardPlayer = null;
    this.faceCardChances = 0;
    this.dealCards();
  }

  private dealCards(): void {
    const hands = Deck.dealCards(this.deck, this.players.length);
    this.players.forEach((player, index) => {
      this.playerHands.set(player.id, hands[index]);
    });
  }

  redistributeCards(): void {
    let allCards: Card[] = [];
    this.playerHands.forEach((hand) => {
      allCards = allCards.concat(hand);
    });
    allCards = allCards.concat(this.pile);

    if (allCards.length === 0) {
      this.deck = Deck.createShuffledDeck().map((card) => ({ ...card }));
      allCards = this.deck;
    }

    shuffleArray(allCards);

    this.playerHands.clear();
    this.players.forEach((player) => {
      this.playerHands.set(player.id, []);
    });

    let currentPlayerIndex = 0;
    allCards.forEach((card) => {
      const currentPlayer = this.players[currentPlayerIndex];
      this.playerHands.get(currentPlayer.id)!.push(card);
      currentPlayerIndex = (currentPlayerIndex + 1) % this.players.length;
    });

    this.pile = [];
  }

  reset(): void {
    this.gameOver = false;
    this.winner = null;
    this.faceCardPlayer = null;
    this.faceCardChances = 0;
    this.currentPlayer = 0;
    this.redistributeCards();
  }

  updateWinCondition(): void {
    const activePlayers = this.players.filter((player) => {
      const hand = this.playerHands.get(player.id);
      return hand && hand.length > 0;
    });

    if (activePlayers.length === 1) {
      this.gameOver = true;
      this.winner = activePlayers[0];
    }

    if (this.faceCardPlayer && this.playerHands.get(this.faceCardPlayer.id)!.length === 0) {
      this.faceCardPlayer = null;
      this.faceCardChances = 0;
    }
  }
}
