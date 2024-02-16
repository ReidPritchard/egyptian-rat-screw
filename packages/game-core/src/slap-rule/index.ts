import { Card } from "../card";
import { Player } from "../player";

/**
 * Represents the effect of a slap rule.
 */
export interface SlapEffect {
  slapper: Player;
  affectedPlayers: Player[];
  pile: Card[];
  message?: string;
}

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
  successfulEffect: (
    slapper: Player,
    players: Player[],
    pile: Card[]
  ) => SlapEffect;

  /**
   * A function that applies the effect of an unsuccessful slap to the player and the pile of cards.
   * @param slapper The player who performed the slap.
   * @param players All players in the game.
   * @param pile The current pile of cards.
   */
  unsuccessfulEffect?: (
    slapper: Player,
    players: Player[],
    pile: Card[]
  ) => SlapEffect;
}

/**
 * The default successful effect of a slap.
 * The player who slapped the pile gets all the cards in the pile.
 */
export const defaultSuccessfulEffect = (
  slapper: Player,
  _players: Player[],
  pile: Card[]
) => {
  slapper.hand.push(...pile);
  pile.length = 0;
  return {
    slapper,
    affectedPlayers: [slapper],
    pile,
    message: "You slapped the pile for doubles!",
  };
};

/**
 * The default penalty for an unsuccessful slap.
 * The player who attempted to slap the pile must put a card at the bottom of the pile.
 */
export const defaultPenalty = (
  slapper: Player,
  _players: Player[],
  pile: Card[]
) => {
  const card = slapper.hand.pop();
  if (card) {
    pile.unshift(card);
  }
  return {
    slapper: slapper,
    affectedPlayers: [slapper],
    pile: pile,
    message: "Your slap failed! A card from your hand was added to the pile.",
  };
};

const defaultSlapEffects = {
  successfulEffect: defaultSuccessfulEffect,
  unsuccessfulEffect: defaultPenalty,
};

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
    ...defaultSlapEffects,
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
    ...defaultSlapEffects,
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
    ...defaultSlapEffects,
  },
];

/**
 * Common valid slap functions for Egyptian Rat Screw and custom slap rules.
 */
const validSlapFunctions = {
  value: (value: string): ((pile: Card[]) => boolean) => {
    return (pile: Card[]) => {
      const topCard = pile[pile.length - 1];
      return topCard.value === value;
    };
  },
  suit: (suit: string): ((pile: Card[]) => boolean) => {
    return (pile: Card[]) => {
      const topCard = pile[pile.length - 1];
      return topCard.suit === suit;
    };
  },
};

/**
 * Common successful slap effects for Egyptian Rat Screw custom rules.
 */
const slapEffectHandlers = {
  playerGetsPile: (
    luckyPlayer: Player
  ): ((slapper: Player, players: Player[], pile: Card[]) => SlapEffect) => {
    return (slapper: Player, players: Player[], pile: Card[]) => {
      luckyPlayer.hand.push(...pile);
      pile.length = 0;
      return {
        slapper,
        affectedPlayers: [luckyPlayer],
        pile,
        message: `${luckyPlayer.name} slapped the pile! They get all the cards!`,
      };
    };
  },
  playerTakesDrink: (
    unluckyPlayer: Player
  ): ((slapper: Player, players: Player[], pile: Card[]) => SlapEffect) => {
    return (slapper: Player, players: Player[], pile: Card[]) => {
      const card = unluckyPlayer.hand.pop();
      if (card) {
        pile.unshift(card);
      }
      return {
        slapper,
        affectedPlayers: [unluckyPlayer],
        pile,
        message: `${slapper.name} slapped the pile! You must take a drink!`,
      };
    };
  },
};

/**
 * A factory function for creating custom slap rules.
 * @param name The name of the slap rule.
 * @param description A description of the slap rule.
 * @param validSlap A function that determines whether a slap is valid.
 * @param successfulEffect A function that applies the effect of a successful slap.
 * @param unsuccessfulEffect A function that applies the effect of an unsuccessful slap.
 */
export function createCustomSlapRule(
  name: string,
  description: string,
  validSlap: (pile: Card[]) => boolean,
  successfulEffect: (
    slapper: Player,
    players: Player[],
    pile: Card[]
  ) => SlapEffect,
  unsuccessfulEffect: (
    slapper: Player,
    players: Player[],
    pile: Card[]
  ) => SlapEffect
): SlapRule {
  return {
    name,
    description,
    validSlap,
    successfulEffect,
    unsuccessfulEffect,
  };
}
