import { Card, FaceCard, isFaceCard } from "../card";
import { ERSGame } from "../core";
import { Player } from "../player";

interface DeactivateConditions {
  faceCardPlayed: boolean;
  tenPlayed: boolean;
  xCardsPlayed: number;
}

/**
 * Represents a rule that is activated by playing a card
 * This is currently a fairly limited implementation as it's only
 * intended to be used for the default ERS rules
 * However it has been seperated out to allow for expansion in the future
 */
export interface CardRule {
  shouldActivate: (card: Card, player: Player, targetPlayer: Player) => boolean;
  shouldDeactivate: (context: ActiveRuleContext, card: Card) => boolean;
  onDeactivation?: (context: ActiveRuleContext, game: ERSGame) => void;
}

/**
 * The context tracked for the active card rule
 * This is used to determine if the rule should be deactivated
 */
interface ActiveRuleContext {
  /**
   * The card that activates the rule
   */
  card: Card;

  /**
   * The player that activated the rule
   */
  actingPlayer: Player;

  /**
   * The player that is the target of the rule
   * (for default rules they keep playing until the rule is deactivated)
   */
  targetPlayer: Player;

  /**
   * The number of cards played since the rule was activated
   */
  cardsPlayed: number;
}

/**
 * The conditions that will deactivate a rule
 */
const faceCardDeactivateConditions: {
  [K in FaceCard]: DeactivateConditions;
} = {
  J: {
    faceCardPlayed: true,
    tenPlayed: true,
    xCardsPlayed: 1,
  },
  Q: {
    faceCardPlayed: true,
    tenPlayed: true,
    xCardsPlayed: 2,
  },
  K: {
    faceCardPlayed: true,
    tenPlayed: true,
    xCardsPlayed: 3,
  },
  A: {
    faceCardPlayed: true,
    tenPlayed: true,
    xCardsPlayed: 4,
  },
};

const jackCardRule: CardRule = {
  shouldActivate: (card: Card) => card.rank === "J",
  shouldDeactivate: (context: ActiveRuleContext, card: Card): boolean => {
    const conditions = faceCardDeactivateConditions["J"];
    return (
      (conditions.faceCardPlayed && isFaceCard(card)) ||
      (conditions.tenPlayed && card.rank === "10") ||
      (Boolean(conditions.xCardsPlayed) &&
        context.cardsPlayed >= conditions.xCardsPlayed)
    );
  },
  onDeactivation: (context: ActiveRuleContext, game: ERSGame) => {
    const { actingPlayer, cardsPlayed } = context;
    const conditions = faceCardDeactivateConditions["J"];
    if (conditions.xCardsPlayed && cardsPlayed === conditions.xCardsPlayed) {
      game.givePileToPlayer(actingPlayer);
    }
  },
};

const queenCardRule: CardRule = {
  shouldActivate: (card: Card) => card.rank === "Q",
  shouldDeactivate: (context: ActiveRuleContext, card: Card): boolean => {
    const conditions = faceCardDeactivateConditions["Q"];
    return (
      (conditions.faceCardPlayed && isFaceCard(card)) ||
      (conditions.tenPlayed && card.rank === "10") ||
      (Boolean(conditions.xCardsPlayed) &&
        context.cardsPlayed >= conditions.xCardsPlayed)
    );
  },
  onDeactivation: (context: ActiveRuleContext, game: ERSGame) => {
    const { actingPlayer, cardsPlayed } = context;
    const conditions = faceCardDeactivateConditions["Q"];
    if (conditions.xCardsPlayed && cardsPlayed === conditions.xCardsPlayed) {
      game.givePileToPlayer(actingPlayer);
    }
  },
};

const kingCardRule: CardRule = {
  shouldActivate: (card: Card) => card.rank === "K",
  shouldDeactivate: (context: ActiveRuleContext, card: Card): boolean => {
    const conditions = faceCardDeactivateConditions["K"];
    return (
      (conditions.faceCardPlayed && isFaceCard(card)) ||
      (conditions.tenPlayed && card.rank === "10") ||
      (Boolean(conditions.xCardsPlayed) &&
        context.cardsPlayed >= conditions.xCardsPlayed)
    );
  },
  onDeactivation: (context: ActiveRuleContext, game: ERSGame) => {
    const { actingPlayer, cardsPlayed } = context;
    const conditions = faceCardDeactivateConditions["K"];
    if (conditions.xCardsPlayed && cardsPlayed === conditions.xCardsPlayed) {
      game.givePileToPlayer(actingPlayer);
    }
  },
};

const aceCardRule: CardRule = {
  shouldActivate: (card: Card) => card.rank === "A",
  shouldDeactivate: (context: ActiveRuleContext, card: Card): boolean => {
    const conditions = faceCardDeactivateConditions["A"];
    return (
      (conditions.faceCardPlayed && isFaceCard(card)) ||
      (conditions.tenPlayed && card.rank === "10") ||
      (Boolean(conditions.xCardsPlayed) &&
        context.cardsPlayed >= conditions.xCardsPlayed)
    );
  },
  onDeactivation: (context: ActiveRuleContext, game: ERSGame) => {
    const { actingPlayer, cardsPlayed } = context;
    const conditions = faceCardDeactivateConditions["A"];
    if (conditions.xCardsPlayed && cardsPlayed === conditions.xCardsPlayed) {
      game.givePileToPlayer(actingPlayer);
    }
  },
};

const defaultCardRules: CardRule[] = [
  jackCardRule,
  queenCardRule,
  kingCardRule,
  aceCardRule,
];

/**
 * Used to track the currently active card rule
 */
export class ActiveRule {
  isCardRuleActive = false;
  activeRuleContext?: ActiveRuleContext;
  cardRules: CardRule[] = defaultCardRules;
  activeCardRule: CardRule | undefined;

  /**
   * Reset after the rule is deactivated
   */
  reset() {
    this.isCardRuleActive = false;
    this.activeRuleContext = undefined;
    this.activeCardRule = undefined;
  }

  /**
   * Set the initial card played, acting player, and target player
   * @param card The card that activated the rule
   * @param actingPlayer The player that played the card
   * @param targetPlayer The player that is the target of the rule
   */
  setInitialConditions(card: Card, actingPlayer: Player, targetPlayer: Player) {
    this.reset();
    this.isCardRuleActive = true;
    this.activeRuleContext = {
      card,
      actingPlayer,
      targetPlayer,
      cardsPlayed: 0,
    };
  }

  shouldActivate(card: Card, actingPlayer: Player, targetPlayer: Player) {
    const newRule = this.cardRules
      .filter((rule) => this.activeCardRule !== rule)
      .find((rule) => rule.shouldActivate(card, actingPlayer, targetPlayer));

    if (newRule) {
      this.activeCardRule = newRule;
      this.setInitialConditions(card, actingPlayer, targetPlayer);
      return true;
    }

    return false;
  }

  /**
   * Check if the rule should be deactivated
   * @param card The last card played
   * @returns True if the rule should be deactivated
   */
  shouldDeactivate(card: Card, game: ERSGame): boolean {
    if (
      !this.activeRuleContext ||
      !this.isCardRuleActive ||
      !this.activeCardRule
    ) {
      return false;
    }

    this.activeRuleContext.cardsPlayed++;

    const shouldDeactivate = this.activeCardRule.shouldDeactivate(
      this.activeRuleContext,
      card
    );
    if (shouldDeactivate) {
      // Check if there's a specific deactivation effect to apply
      this.activeCardRule.onDeactivation?.(this.activeRuleContext, game);
      this.reset();
    }

    return shouldDeactivate;
  }
}
