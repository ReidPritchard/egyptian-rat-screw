import { Card } from "./card";
import { Player } from "./player";
import { SlapRule, defaultSlapRules } from "./slap-rule";

/**
 * Represents a game of Egyptian Rat Screw.
 */
export class EgyptianRatScrew {
  players: Player[];
  score: Map<Player["name"], number>;

  deck: Card[];
  pile: Card[];

  slapRules: SlapRule[];

  constructor(players: Player[]) {
    this.players = players;
    this.score = new Map();
    for (let player of players) {
      this.score.set(player.name, 0);
    }

    this.deck = this.createDeck();
    this.pile = [];
    this.slapRules = defaultSlapRules;
  }

  createDeck(): Card[] {
    let suits = ["hearts", "diamonds", "clubs", "spades"];
    let values = [
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
      "A",
    ];
    let deck = [];

    for (let suit of suits) {
      for (let value of values) {
        deck.push(new Card(suit, value));
      }
    }

    return this.shuffleDeck(deck);
  }

  shuffleDeck(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  dealCards() {
    while (this.deck.length > 0) {
      for (let player of this.players) {
        if (this.deck.length === 0) break;
        let card = this.deck.pop();
        if (card) {
          player.hand.push(card);
        }
      }
    }
  }

  status() {
    let status = "";
    for (let player of this.players) {
      status += `${player.name}: ${player.hand.length} cards\n`;
    }
    status += `Pile: ${this.pile.length} cards\n`;
    return status;
  }

  /**
   * Method to send only the information needed to a player's client
   * @param player The player to send the information to
   * @returns The information to send to the player
   */
  playerStatus(player: Player) {
    return {
      hand: player.hand,
      pile: this.pile.length,
      score: this.score.get(player.name),
    };
  }

  validSlap(): boolean {
    this.slapRules.forEach((rule) => {
      if (rule.validSlap(this.pile)) {
        return true;
      }
    });
    return false;
  }

  slapPile(player: Player) {
    const valid = this.validSlap();
    if (valid) {
      let rule = this.slapRules.find((rule) => rule.validSlap(this.pile));
      if (rule) {
        rule.successfulEffect(player, this.players, this.pile);
      }
    } else {
      // Penalize the player for an invalid slap
      // Put one card from the player's hand onto the bottom of the pile
      const card = player.hand.shift();
      if (card) {
        this.pile.unshift(card);
      }
    }
    return valid;
  }

  playCard(player: Player) {
    const card = player.hand.shift();
    if (card) {
      this.pile.push(card);
    }
  }

  setSlapRules(rules: SlapRule[]) {
    this.slapRules = rules;
  }

  reset() {
    this.pile.length = 0;
    this.deck = this.createDeck();

    for (let player of this.players) {
      player.hand.length = 0;
    }
  }

  startGame() {
    this.reset();

    this.deck = this.shuffleDeck(this.deck);
    this.dealCards();
  }
}

export * from "./event";
