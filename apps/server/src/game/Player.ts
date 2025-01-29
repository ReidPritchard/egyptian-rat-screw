import type { Card, PlayerInfo } from "../types.js";
import type { Messenger } from "./Messenger.js";

export class Player {
  public messenger: Messenger;
  public name: string;
  public isBot = false;
  private deck: Card[] = [];
  private ready = false;

  constructor(messenger: Messenger, name: string, isBot = false) {
    this.messenger = messenger;
    this.name = name;
    this.isBot = isBot;
  }

  public reset(): void {
    this.deck = [];
    this.ready = false;
  }

  public receiveCards(cards: Card[]) {
    this.deck.push(...cards);
  }

  public playCard(): Card | undefined {
    return this.deck.shift();
  }

  public collectPile(pile: Card[]) {
    // if the pile is less than 5 cards, shuffle it
    // this is to prevent the order of played cards from being predictable
    let shuffledPile = pile;
    if (pile.length < 10) {
      shuffledPile = this.shuffle(pile);
    }
    this.deck.push(...shuffledPile);
  }

  public givePenaltyCard(): Card | undefined {
    return this.deck.shift();
  }

  public hasCards(): boolean {
    return this.deck.length > 0;
  }

  public getDeckSize(): number {
    return this.deck.length;
  }

  public getPlayerInfo(): PlayerInfo {
    return {
      id: this.messenger.id,
      name: this.name,
      isBot: this.isBot,
    };
  }

  public setReady(ready: boolean) {
    this.ready = ready;
  }

  public isReady(): boolean {
    return this.ready;
  }

  private shuffle(cards: Card[]): Card[] {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }
}
