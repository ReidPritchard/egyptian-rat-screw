import { Rule, RuleContext } from ".";
import { Card, FaceCard, isFaceCard } from "../card";
import { Player } from "../player";

export class FaceCardRule implements Rule<RuleContext> {
  id = "QueenRule";
  tags = ["card-play"];

  calculatePriority(context: RuleContext): number {
    // This rule has high priority when a Queen is played
    const lastCardPlayed = context.metadata.lastCardPlayed;
    return lastCardPlayed && lastCardPlayed.rank === "Queen" ? 100 : 0;
  }

  evaluate(context: RuleContext): boolean {
    // Check if the last card played is a Queen
    const lastCardPlayed = context.metadata.lastCardPlayed;
    return lastCardPlayed && lastCardPlayed.rank === "Queen";
  }

  execute(context: RuleContext): void {
    // Implement the logic for the next player having to play until a 10, another face card, or three cards without either
    const nextPlayer = this.getNextPlayer(context);
    context.metadata.set("targetPlayer", nextPlayer);
    context.metadata.set("queenRuleActive", true);
    context.metadata.set("cardsPlayed", 0);
  }

  indicateRuleInEffect(context: RuleContext): void {
    // Optional: Update UI to indicate the rule is in effect
  }

  private getNextPlayer(context: RuleContext): Player {
    const actingPlayerIndex = context.gameState.currentPlayerIndex;
    const nextPlayerIndex =
      (actingPlayerIndex + 1) % context.gameState.players.length;
    return context.gameState.players[nextPlayerIndex];
  }
}

/**
 * Used to track the currently active card rule
 */
export class ActiveRule {
  isCardRuleActive = false;

  /**
   * The card that was played to activate the rule
   */
  initialCardPlayed?: Card;

  /**
   * The player that activated this rule
   */
  actingPlayer?: Player;

  /**
   * The player that is the target of the rule
   * They keep playing until the rule is deactivated
   */
  targetPlayer?: Player;

  /**
   * The number of cards played since the rule was activated
   */
  cardsPlayed = 0;

  /**
   * All conditions that will deactivate the rule
   * If any of these conditions are met, the rule is deactivated
   */
  deactivateConditions: {
    faceCardPlayed: boolean;
    tenPlayed: boolean;
    xCardsPlayed: number;
  } = {
    faceCardPlayed: true,
    tenPlayed: true,
    xCardsPlayed: 3,
  };

  /**
   * Reset after the rule is deactivated
   */
  reset() {
    this.isCardRuleActive = false;
    this.initialCardPlayed = undefined;
    this.actingPlayer = undefined;
    this.targetPlayer = undefined;
    this.cardsPlayed = 0;
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
    this.initialCardPlayed = card;
    this.actingPlayer = actingPlayer;
    this.targetPlayer = targetPlayer;
    this.deactivateConditions =
      faceCardDeactivateConditions[card.rank as FaceCard];
  }

  /**
   * Check if the rule should be deactivated
   * @param card The last card played
   * @returns True if the rule should be deactivated
   */
  shouldDeactivate(card: Card): boolean {
    if (this.deactivateConditions.faceCardPlayed && isFaceCard(card)) {
      return true;
    }

    if (this.deactivateConditions.tenPlayed && card.rank === "10") {
      return true;
    }

    if (this.deactivateConditions.xCardsPlayed <= this.cardsPlayed) {
      return true;
    }

    return false;
  }
}

interface DeactivateConditions {
  faceCardPlayed: boolean;
  tenPlayed: boolean;
  xCardsPlayed: number;
}

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
