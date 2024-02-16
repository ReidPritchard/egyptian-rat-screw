export class Card {
  suit: string;
  value: string;

  constructor(suit: string, value: string) {
    this.suit = suit;
    this.value = value;
  }

  toString(): string {
    return `${this.value} of ${this.suit}`;
  }
}
