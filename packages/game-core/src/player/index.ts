import { Card } from '../card';

export type PlayerStatus =
  | 'waiting'
  | 'ready'
  | 'playing'
  | 'eliminated'
  | 'winner'
  | 'unknown';

export class Player {
  name: string;
  hand: Card[];
  status: PlayerStatus = 'ready';

  constructor(name: string) {
    this.name = name;
    this.hand = [];
  }
}
