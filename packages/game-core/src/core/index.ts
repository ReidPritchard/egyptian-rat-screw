import { Card } from "../card";
import { DataPayload } from "../event";
import { Player } from "../player";
import {
  SlapEffect,
  SlapRule,
  defaultPenalty,
  defaultSlapRules,
} from "../slap-rule";
import { debug, info } from "@repo/utils";

/**
 * Represents a game of Egyptian Rat Screw.
 */
export class EgyptianRatScrew {
  gameActive: boolean = false;

  players: Player[];
  currentPlayerIndex: number;
  score: Map<Player["name"], number>;

  deck: Card[];
  pile: Card[];

  slapRules: SlapRule[];

  constructor(players: Player[]) {
    this.players = players;
    this.currentPlayerIndex = Math.floor(Math.random() * players.length);
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

  slapPile(player: Player) {
    if (!this.gameActive) {
      throw new Error("Game is not active");
    }
    const rule = this.slapRules.find((rule) => rule.validSlap(this.pile));
    const valid = rule !== undefined;
    valid
      ? rule.applySlapEffect(player, this.players, this.pile)
      : defaultPenalty(player, this.players, this.pile);
    return valid;
  }

  playCard(player: Player) {
    if (!this.gameActive) {
      throw new Error("Game is not active");
    }
    const card = player.hand.shift();
    if (card) {
      this.pile.push(card);
    }
    return card;
  }

  setSlapRules(rules: SlapRule[]) {
    this.slapRules = rules;
  }

  reset() {
    this.pile.length = 0;
    this.deck = this.createDeck();

    for (let player of this.players) {
      player.hand = [];
    }
  }

  startGame() {
    this.reset();
    this.gameActive = true;

    this.deck = this.shuffleDeck(this.deck);
    this.dealCards();
  }

  endGame() {
    this.gameActive = false;
  }
}

export interface PlayerGameOptions {
  gameId?: string;
  name?: string;
  handSize?: number;
  pile?: Card[];
  slapRules?: SlapRule[];
  currentPlayer?: string;
  players?: string[];
  scores?: Map<string, number>;
  active?: boolean;
}

/**
 * Represents the game from the perspective of a player's client
 * This is the information that will be sent to the player and used to update the client
 */
export class PlayerGame {
  gameId: string;
  name: string;

  handSize: number;
  pile: Card[];
  slapRules: SlapRule[];
  currentPlayer: string;
  players: string[];
  scores: Map<string, number>;
  active: boolean;

  message: string = "";

  constructor(options: PlayerGameOptions = {}) {
    this.gameId = options.gameId || "";
    this.name = options.name || "";
    this.handSize = options.handSize || 0;
    this.pile = options.pile || [];
    this.slapRules = options.slapRules || [];
    this.currentPlayer = options.currentPlayer || "";
    this.players = options.players || [];
    this.scores = options.scores || new Map();
    this.active = options.active || false;
  }

  nextTurn() {
    const nextPlayerIndex =
      (this.players.indexOf(this.currentPlayer) + 1) % this.players.length;
    this.currentPlayer = this.players[nextPlayerIndex];
  }

  handleDataReceived(payload: DataPayload) {
    const { type } = payload;

    switch (type) {
      case "lobby":
        break;
      case "join-game": {
        const { name: newPlayer } = payload;
        this.name = newPlayer;
        this.active = true;
        break;
      }
      case "player-joined": {
        const { name: newPlayer } = payload;
        this.players = [...this.players, newPlayer];
        break;
      }
      case "player-left": {
        const { name: gonePlayer } = payload;
        this.players = this.players.filter((p) => p !== gonePlayer);
        break;
      }
      case "game-started": {
        const {
          slapRules: gameSlapRules,
          handSize: gameHandSize,
          players: gamePlayers,
          scores: gameScores,
        } = payload;
        this.active = true;
        this.slapRules = gameSlapRules;

        this.handSize = Number(gameHandSize);
        this.pile = [];
        this.players = gamePlayers;
        this.scores = gameScores;
        break;
      }
      case "slap": {
        const { successful, effect } = payload;
        const {
          slapper,
          affectedPlayers,
          pile: newPile,
          message: newMessage,
        } = effect as Partial<SlapEffect>;

        if (!slapper || !affectedPlayers || !newPile || !newMessage) {
          throw new Error("Invalid slap effect");
        }

        info("Slap effect", effect);

        this.pile = newPile;
        this.message = `${slapper} slapped the pile${successful ? "!" : ", but it was invalid!"}`;

        if (affectedPlayers.includes(this.name)) {
          info("Affected players", affectedPlayers);
          this.message += `\n${newMessage}`;
        }
        break;
      }
      case "play-card": {
        const { card, name: player } = payload;
        if (card !== undefined) {
          info("Card played", card, player);

          if (player === this.name) {
            this.message = `You played a ${card.toString()}`;
          } else {
            this.message = `${player} played a card`;
          }
          this.pile = [...this.pile, card];

          // Next player's turn
          this.nextTurn();
        } else {
          // This should never happen
          debug("Card is undefined", payload);
          throw new Error("Card is undefined");
        }
        break;
      }
      case "error": {
        const { message: errorMessage } = payload;
        info("Error", errorMessage);
        this.message = errorMessage;
        break;
      }
    }
  }

  /**
   * Method to generate the payload to send to the server
   * @param action The action to perform
   * @returns The payload to send to the server
   */
  generatePayload(action: DataPayload["type"]): DataPayload {
    switch (action) {
      case "join-game":
        return {
          type: "join-game",
          name: this.name,
          gameId: this.gameId,
        };
      case "slap":
        return {
          type: "slap",
          name: this.name,
        };
      case "play-card":
        return {
          type: "play-card",
          name: this.name,
        };
      default:
        throw new Error("Invalid action");
    }
  }

  /**
   * Method to serialize the player game to a JSON string
   * This allows for easy comparison of the previous and updated player game states
   * @returns The serialized player game
   */
  serialize(): string {
    return JSON.stringify({
      gameId: this.gameId,
      name: this.name,
      handSize: this.handSize,
      pile: this.pile,
      slapRules: this.slapRules,
      currentPlayer: this.currentPlayer,
      players: this.players,
      scores: this.scores,
      active: this.active,
    });
  }
}
