import type { Messenger } from "@oer/message";
import { type Card, type PlayerInfo, PlayerStatus } from "@oer/shared/types";

export class Player {
  public readonly messenger: Messenger;
  public readonly name: string;
  public isBot = false;
  private cards: Card[] = [];

  public status: PlayerStatus;
  public isActive: boolean;
  public lastActivity: Date;

  constructor(messenger: Messenger, name: string, isBot = false) {
    this.messenger = messenger;
    this.name = name;
    this.isBot = isBot;
    this.status = PlayerStatus.UNKNOWN;
    this.isActive = true;
    this.lastActivity = new Date();
  }

  public isReady(): boolean {
    return this.status === PlayerStatus.READY;
  }

  public setReady(ready: boolean): void {
    this.status = ready ? PlayerStatus.READY : PlayerStatus.NOT_READY;
  }

  public addCards(cards: Card[]): void {
    this.cards.push(...cards);
  }

  public playCard(): Card | undefined {
    return this.cards.shift();
  }

  public getCardCount(): number {
    return this.cards.length;
  }

  public reset(): void {
    this.cards = [];
    this.status = PlayerStatus.UNKNOWN;
    this.isActive = false;
    this.lastActivity = new Date();
  }

  public collectPile(pile: Card[]) {
    // if the pile is less than 5 cards, shuffle it
    // this is to prevent the order of played cards from being predictable
    let shuffledPile = pile;
    if (pile.length < 10) {
      shuffledPile = this.shuffle(pile);
    }
    this.cards.push(...shuffledPile);
  }

  public givePenaltyCard(): Card | undefined {
    return this.cards.shift();
  }

  public hasCards(): boolean {
    return this.cards.length > 0;
  }

  public getDeckSize(): number {
    return this.cards.length;
  }

  public getPlayerInfo(): PlayerInfo {
    return {
      id: this.messenger.id,
      name: this.name,
      isBot: this.isBot,
    };
  }

  private shuffle(cards: Card[]): Card[] {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }
}
