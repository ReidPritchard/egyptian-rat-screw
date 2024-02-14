import { Card } from "../card";

export class Player {
  name: string;
  hand: Card[];

  constructor(name: string) {
    this.name = name;
    this.hand = [];
  }
}
