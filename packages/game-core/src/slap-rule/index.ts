import { Card } from "../card";
import { Player } from "../player";

/**
 * Represents the effect of a slap rule.
 */
export interface SlapEffect {
  slapper: Player["name"];
  affectedPlayers: Player["name"][];
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
   * A slap is valid even if it has negative consequences for the slapper! The consequences
   * are handled by the `applySlapEffect` function.
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
  applySlapEffect: (
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
    slapper: slapper.name,
    affectedPlayers: [slapper.name],
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
    slapper: slapper.name,
    affectedPlayers: [slapper.name],
    pile: pile,
    message: "Your slap failed! A card from your hand was added to the pile.",
  };
};

const defaultSlapEffects = {
  applySlapEffect: defaultSuccessfulEffect,
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
export const validSlapFunctions = {
  value: (value: string): ((pile: Card[]) => boolean) => {
    return (pile: Card[]) => {
      const topCard = pile[pile.length - 1];
      return topCard?.value === value;
    };
  },
  suit: (suit: string): ((pile: Card[]) => boolean) => {
    return (pile: Card[]) => {
      const topCard = pile[pile.length - 1];
      return topCard?.suit === suit;
    };
  },
};

/**
 * Common successful slap effects for Egyptian Rat Screw custom rules.
 */
export const slapEffectHandlers = {
  playerGetsPile: (
    luckyPlayer: Player
  ): ((slapper: Player, players: Player[], pile: Card[]) => SlapEffect) => {
    return (slapper: Player, players: Player[], pile: Card[]) => {
      luckyPlayer.hand.push(...pile);
      pile.length = 0;
      return {
        slapper: slapper.name,
        affectedPlayers: [luckyPlayer.name],
        pile,
        message: `${luckyPlayer.name} slapped the pile! They get all the cards!`,
      };
    };
  },
  playerTakesDrink: (
    unluckyPlayer: Player
  ): ((slapper: Player, players: Player[], pile: Card[]) => SlapEffect) => {
    return (slapper: Player, players: Player[], pile: Card[]) => {
      const slapperIsUnlucky = slapper.name === unluckyPlayer.name;
      // If the slapper is the unlucky player, they must take two drinks
      const drinks = slapperIsUnlucky ? 2 : 1;

      return {
        slapper: slapper.name,
        affectedPlayers: [unluckyPlayer.name],
        pile,
        message: `${slapper.name} slapped the pile! ${unluckyPlayer.name} takes ${drinks} drink${drinks > 1 ? "s" : ""}!`,
      };
    };
  },
};

/**
 * Builder class for creating custom slap rules for Egyptian Rat Screw.
 * This class is used to create custom slap rules for the game.
 * @example
 * ```typescript
 * const slapRuleBuilder = new SlapRuleBuilder();
 * const customSlapRule = slapRuleBuilder
 *  .setName("custom")
 *  .setDescription("Slap the pile if the top card is a 10.")
 *  .setValidSlap(validSlapFunctions.value("10"))
 *  .setSlapEffect(slapEffectHandlers.playerTakesDrink(players[0]))
 *  .build();
 * ```
 */
export class SlapRuleBuilder {
  private _name: string = "";
  private _description: string = "";
  private _validSlap: (pile: Card[]) => boolean = () => false;
  private _slapEffect: (
    slapper: Player,
    players: Player[],
    pile: Card[]
  ) => SlapEffect = () => {
    return {
      slapper: "",
      affectedPlayers: [],
      pile: [],
    };
  };

  /**
   * Sets the name of the slap rule.
   * @param name The name of the slap rule.
   * @returns The builder instance.
   */
  setName(name: string): this {
    this._name = name;
    return this;
  }

  /**
   * Sets the description of the slap rule.
   * @param description The description of the slap rule.
   * @returns The builder instance.
   */
  setDescription(description: string): this {
    this._description = description;
    return this;
  }

  /**
   * Sets the valid slap function of the slap rule.
   * @param validSlap The valid slap function of the slap rule.
   * @returns The builder instance.
   */
  setValidSlap(validSlap: (pile: Card[]) => boolean): this {
    this._validSlap = validSlap;
    return this;
  }

  /**
   * Sets the slap effect function of the slap rule.
   * @param slapEffect The slap effect function of the slap rule.
   * @returns The builder instance.
   */
  setSlapEffect(
    slapEffect: (slapper: Player, players: Player[], pile: Card[]) => SlapEffect
  ): this {
    this._slapEffect = slapEffect;
    return this;
  }

  /**
   * Builds the slap rule with the provided properties.
   * @returns The slap rule.
   */
  build(): SlapRule {
    return {
      name: this._name,
      description: this._description,
      validSlap: this._validSlap,
      applySlapEffect: this._slapEffect,
    };
  }
}
