import { type Card, Ranks, Suits } from "@oer/shared/types";
import type { Player } from "./Player.js";

export class Deck {
	private suits: (typeof Suits)[number][];
	private ranks: (typeof Ranks)[number][];
	private numDecks: number;

	private deck: Card[] = [];

	constructor(options?: {
		suits?: (typeof Suits)[number][];
		ranks?: (typeof Ranks)[number][];
		numDecks?: number;
	}) {
		this.suits = options?.suits || [...Suits];
		this.ranks = options?.ranks || [...Ranks];
		this.numDecks = options?.numDecks || 1;

		this.buildDeck();
	}

	private buildDeck(): void {
		for (let i = 0; i < this.numDecks; i++) {
			for (const suit of this.suits) {
				for (const rank of this.ranks) {
					this.deck.push({
						id: `${rank}${suit}`,
						code: `${rank}${suit.charAt(0)}`,
						rank: rank,
						suit: suit,
					});
				}
			}
		}
	}

	public getDeck(): Card[] {
		return this.deck;
	}

	public resetDeck(): void {
		this.deck = [];
		this.buildDeck();
	}

	public shuffle(): void {
		for (let i = this.deck.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
		}
	}

	public dealCards(players: Player[], cardsPerPlayer?: number): void {
		let roundsDealt = 0;

		while (
			this.deck.length > 0 &&
			(cardsPerPlayer === undefined || roundsDealt < cardsPerPlayer)
		) {
			for (const player of players) {
				const card = this.deck.pop();
				if (card) {
					player.addCards([card]);
				} else {
					break;
				}
			}
			roundsDealt++;
		}
	}
}
