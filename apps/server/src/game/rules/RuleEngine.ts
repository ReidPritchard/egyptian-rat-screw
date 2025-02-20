import type { Card, GameSettings, SlapRule } from "@oer/shared/types";
import type { Player } from "../Player.js";
import { Condition } from "./Condition.js";

export class RuleEngine {
  private rules: GameSettings;

  constructor(rules: GameSettings) {
    this.rules = rules;
  }

  private evaluateRule(rule: SlapRule, pile: Card[], slapper: Player): boolean {
    let result = true;
    for (const condition of rule.conditions) {
      const checkableCondition = new Condition(condition);
      result = result && checkableCondition.check(pile, slapper);
    }
    return result;
  }

  public checkSlapCondition(pile: Card[], slapper: Player): boolean {
    for (const rule of this.rules.slapRules) {
      if (this.evaluateRule(rule, pile, slapper)) {
        return true;
      }
    }

    // Additional conditions can be added based on this.rules
    return false;
  }

  public getValidSlapRules(pile: Card[], slapper: Player): SlapRule[] {
    return this.rules.slapRules.filter((rule) =>
      this.evaluateRule(rule, pile, slapper)
    );
  }

  public validateSlap(pile: Card[], slapper: Player): boolean {
    // Validate the slap according to the current pile and rules
    return this.checkSlapCondition(pile, slapper);
  }

  public getTurnTimeLimit(): number {
    return this.rules.turnTimeout || 10000; // Default 10 seconds
  }

  public getMinimumPlayers(): number {
    return this.rules.minimumPlayers || 2;
  }

  public getMaximumPlayers(): number {
    return this.rules.maximumPlayers || 8;
  }

  public isChallengeCard(card: Card): boolean {
    const challengeCards = Object.keys(
      this.rules.faceCardChallengeCounts || {}
    );
    return challengeCards.includes(card.rank);
  }

  public getFaceCardChallengeCount(card: Card): number {
    const faceCardValues = this.rules.faceCardChallengeCounts || {
      J: 1,
      Q: 2,
      K: 3,
      A: 4,
    };

    if (faceCardValues[card.rank]) {
      return faceCardValues[card.rank];
    }
    return 0;
  }

  public isCounterCard(card: Card): boolean {
    // Custom rule: A '10' can counter a face card
    if (this.rules.challengeCounterCards?.includes(card)) {
      return true;
    }
    return false;
  }

  public getGameSettings(): GameSettings {
    return this.rules;
  }

  public setGameSettings(settings: GameSettings) {
    this.rules = settings;
  }

  private evaluateSlapRule(
    rule: SlapRule,
    pile: Card[],
    slapper: Player
  ): boolean {
    for (const condition of rule.conditions) {
      const checkableCondition = new Condition(condition);
      if (!checkableCondition.check(pile, slapper)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Checks if a slap is valid according to the game rules
   * @param pile - The central pile of cards to check for a valid slap
   * @param slapper - The player who is slapping
   * @returns The matching slap rule if the slap is valid, null otherwise
   */
  public checkSlap(pile: Card[], slapper: Player): SlapRule | null {
    if (pile.length < 2) return null;

    for (const rule of this.rules.slapRules) {
      if (this.evaluateSlapRule(rule, pile, slapper)) {
        return rule;
      }
    }

    return null;
  }
}
