import { Card, GameSettings, SlapRule } from '../../types';
import { Player } from '../Player';
import { Condition } from './Condition';

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
    return this.rules.slapRules.filter((rule) => this.evaluateRule(rule, pile, slapper));
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

  public checkFaceCardChallenge(card: Card): number {
    // Returns the number of cards the next player must play
    const faceCardValues: { [key: string]: number } = {
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

  public getFaceCardChallengeCount(card: Card): number {
    // Customizable face card challenge counts
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

  public isFaceCard(card: Card): boolean {
    return ['J', 'Q', 'K', 'A'].includes(card.rank);
  }

  public isCounterCard(card: Card): boolean {
    // Custom rule: A '10' can counter a face card
    if (this.rules.challengeCounterCards && this.rules.challengeCounterCards.includes(card)) {
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
}
