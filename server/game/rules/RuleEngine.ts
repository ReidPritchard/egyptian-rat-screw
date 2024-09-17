import { Card } from '../Deck';
import { Player } from '../Player';

export class RuleEngine {
  private rules: any;

  constructor(rules: any) {
    this.rules = rules;
  }

  public checkSlapCondition(pile: Card[]): boolean {
    // Implement customizable slap conditions
    // Example: Double (two cards of the same rank in a row)
    if (pile.length >= 2) {
      const topCard = pile[pile.length - 1];
      const prevCard = pile[pile.length - 2];
      if (topCard.rank === prevCard.rank) {
        return true;
      }
    }
    // Additional conditions can be added based on this.rules
    return false;
  }

  public validateSlap(pile: Card[]): boolean {
    // Validate the slap according to the current pile and rules
    return this.checkSlapCondition(pile);
  }

  public getSlapTimeLimit(): number {
    return this.rules.slapTimeLimit || 2000; // Default 2 seconds
  }

  public getTurnTimeLimit(): number {
    return this.rules.turnTimeLimit || 10000; // Default 10 seconds
  }

  public getMinimumPlayers(): number {
    return this.rules.minimumPlayers || 2;
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
    const faceCardValues = this.rules.faceCardValues || {
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
    if (this.rules.counterCardRanks && this.rules.counterCardRanks.includes(card.rank)) {
      return true;
    }
    return false;
  }

  public getSocialAction(slapper: Player, players: Player[], pile: Card[]): string | null {
    // Implement social rules
    if (this.rules.socialRules) {
      // Example: If player X slaps a rank 6, player Y must take a drink
      const topCard = pile[pile.length - 1];
      for (const rule of this.rules.socialRules) {
        if (topCard.rank === rule.cardRank && slapper.name === rule.slapperName) {
          return `${rule.targetPlayerName} must ${rule.action}`;
        }
      }
    }
    return null;
  }
}
