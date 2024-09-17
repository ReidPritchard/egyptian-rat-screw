import { Socket } from 'socket.io';
import { Card } from './Deck';

export class Player {
  public socket: Socket;
  public name: string;
  private deck: Card[] = [];

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
    this.deck.push(...this.shuffle(pile));
  }

  public givePenaltyCard(): Card | undefined {
    return this.deck.shift();
  }

  public hasCards(): boolean {
    return this.deck.length > 0;
  }

  private shuffle(cards: Card[]): Card[] {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }
}
