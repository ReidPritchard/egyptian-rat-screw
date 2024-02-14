import { Card } from "../card";
import { Player } from "../player";

/**
 * Represents a rule for performing a slap in the game.
 */
export interface SlapRule {
  /**
   * The name of the slap rule.
   */
  name: string;

  /**
   * A description of the slap rule.
   */
  description: string;

  /**
   * A function that determines whether a slap is valid based on the current pile of cards.
   * @param pile The current pile of cards.
   * @returns A boolean indicating whether the slap is valid.
   */
  validSlap: (pile: Card[]) => boolean;

  /**
   * A function that applies the effect of the slap rule to the player and the pile of cards.
   * @param slapper The player who performed the slap.
   * @param players All players in the game.
   * @param pile The current pile of cards.
   */
  effect: (slapper: Player, players: Player[], pile: Card[]) => void;
}

/**
 * The default slap rules for Egyptian Rat Screw.
 */
export const defaultSlapRules: SlapRule[] = [
  {
    name: "doubles",
    description: "Slap the pile if the top two cards are the same.",
    validSlap: (pile: Card[]) => {
      const topCard = pile[pile.length - 1];
      const secondCard = pile[pile.length - 2];
      return topCard.value === secondCard.value;
    },
    effect: (slapper: Player, players: Player[], pile: Card[]) => {
      slapper.hand.push(...pile);
      pile.length = 0;
    },
  },
  {
    name: "sandwiches",
    description:
      "Slap the pile if the top card and the card two cards down are the same.",
    validSlap: (pile: Card[]) => {
      const topCard = pile[pile.length - 1];
      const thirdCard = pile[pile.length - 3];
      return topCard.value === thirdCard.value;
    },
    effect: (slapper: Player, players: Player[], pile: Card[]) => {
      slapper.hand.push(...pile);
      pile.length = 0;
    },
  },
  {
    name: "top-bottom",
    description:
      "Slap the pile if the top card and the bottom card are the same.",
    validSlap: (pile: Card[]) => {
      const topCard = pile[pile.length - 1];
      const bottomCard = pile[0];
      return topCard.value === bottomCard.value;
    },
    effect: (slapper: Player, players: Player[], pile: Card[]) => {
      slapper.hand.push(...pile);
      pile.length = 0;
    },
  },
];
