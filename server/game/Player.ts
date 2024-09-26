import { Socket } from 'socket.io';
import { Card, PlayerInfo } from '../types'; // Updated import path

export class Player {
  public socket: Socket;
  public name: string;
  private deck: Card[] = [];
  private ready: boolean = false;

  constructor(socket: Socket, name: string) {
    this.socket = socket;
    this.name = name;
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
    if (pile.length < 10) {
      pile = this.shuffle(pile);
    }
    this.deck.push(...pile);
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
      id: this.socket.id,
      name: this.name,
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
