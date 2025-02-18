import type { PlayerInfo } from "../types.js";

/**
 * Represents a face card challenge in the game
 */
export class FaceCardChallenge {
  private challenger: PlayerInfo;
  private challengeCount: number;
  private remainingPlays: number;
  private currentPlayerId: string;

  constructor(
    challenger: PlayerInfo,
    challengeCount: number,
    nextPlayerId: string
  ) {
    this.challenger = challenger;
    this.challengeCount = challengeCount;
    this.remainingPlays = challengeCount;
    this.currentPlayerId = nextPlayerId;
  }

  /**
   * Gets the player who initiated the challenge
   */
  public getChallenger(): PlayerInfo {
    return this.challenger;
  }

  /**
   * Gets the number of chances remaining for the target player
   */
  public getRemainingPlays(): number {
    return this.remainingPlays;
  }

  /**
   * Gets the ID of the player who needs to play next
   */
  public getCurrentPlayerId(): string {
    return this.currentPlayerId;
  }

  /**
   * Updates the challenge state when a counter is played
   * @param newChallenger - The new challenger (player who countered)
   * @param newChallengeCount - The new number of plays required
   * @param nextPlayerId - The ID of the next player to play
   */
  public updateCounter(
    newChallenger: PlayerInfo,
    newChallengeCount: number,
    nextPlayerId: string
  ): void {
    this.challenger = newChallenger;
    this.challengeCount = newChallengeCount;
    this.remainingPlays = newChallengeCount || 1;
    this.currentPlayerId = nextPlayerId;
  }

  /**
   * Decrements the remaining plays and updates the next player
   * @param nextPlayerId - The ID of the next player to play
   * @returns true if the challenge is complete (no remaining plays), false otherwise
   */
  public decrementPlays(nextPlayerId: string): boolean {
    this.remainingPlays--;
    this.currentPlayerId = nextPlayerId;
    return this.remainingPlays === 0;
  }
}
