import type {
  Card,
  FaceCardSequence,
  GameAction,
  PlayerInfo,
} from "@oer/shared/types";
import { GameActionType } from "@oer/shared/types";
import { newLogger } from "../../logger.js";
import type { GameCore } from "../GameCore.js";
import type { GameEventLogger } from "../GameEventLogger.js";
import type { GameNotifier } from "../GameNotifier.js";
import type { Player } from "../models/Player.js";
import type { RuleEngine } from "../rules/RuleEngine.js";

const logger = newLogger("FaceCardService");

/**
 * Manages the face card challenge mechanic in Egyptian Ratscrew
 *
 * In Egyptian Ratscrew, when a face card (J, Q, K) or Ace is played,
 * the next player must "pay tribute" by playing a specific number of cards:
 * - Jack: Next player must pay 1 card
 * - Queen: Next player must pay 2 cards
 * - King: Next player must pay 3 cards
 * - Ace: Next player must pay 4 cards
 *
 * If during tribute payment, the paying player places another face card,
 * the payment sequence transfers to the next player.
 */
export class FaceCardService {
  private gameCore: GameCore;
  private ruleEngine: RuleEngine;
  private eventLogger: GameEventLogger;
  private notifier: GameNotifier;
  private activeChallenge: FaceCardSequence | null = null;

  constructor(
    gameCore: GameCore,
    ruleEngine: RuleEngine,
    eventLogger: GameEventLogger,
    notifier: GameNotifier
  ) {
    this.gameCore = gameCore;
    this.ruleEngine = ruleEngine;
    this.eventLogger = eventLogger;
    this.notifier = notifier;
  }

  /**
   * Reset the face card challenge state
   */
  public reset(): void {
    this.activeChallenge = null;
  }

  /**
   * Check if there's an active face card challenge
   * @returns True if a face card challenge is currently active
   */
  public hasActiveChallenge(): boolean {
    return this.activeChallenge !== null;
  }

  /**
   * Process a card being played and handle face card challenge logic
   * @param player - The player who played the card
   * @param card - The card that was played
   * @returns True if the card was part of a face card challenge sequence
   */
  public handleCardPlay(player: Player, card: Card): boolean {
    if (!(player && card)) {
      logger.warn("Invalid player or card in handleCardPlay");
      return false;
    }

    // If there's an active challenge, handle the response
    if (this.hasActiveChallenge()) {
      return this.handleChallengeResponse(player, card);
    }

    // Check if the played card initiates a new challenge
    const challengeCount = this.ruleEngine.getFaceCardChallengeCount(card);
    if (challengeCount > 0) {
      this.startChallenge(player, card);
      return true;
    }

    // If not, advance the turn
    this.gameCore.advanceTurn();

    return false;
  }

  /**
   * Get the current face card challenge state
   * @returns The current face card challenge state or null if no active challenge
   */
  public getChallengeState(): FaceCardSequence | null {
    return this.activeChallenge;
  }

  /**
   * Start a new face card challenge
   * @param challenger - Player who played the face card
   * @param card - The face card that initiated the challenge
   */
  public startChallenge(challenger: Player, card: Card): void {
    const faceCardCount = this.ruleEngine.getFaceCardChallengeCount(card);

    if (faceCardCount <= 0) {
      logger.warn(
        `Attempted to start challenge with non-face card: ${card.rank}${card.suit}`
      );
      return;
    }

    const challengerInfo: PlayerInfo = this.createPlayerInfo(challenger);
    const nextPlayerId = this.getNextPlayerId();

    this.activeChallenge = {
      initiator: challengerInfo,
      activePlayerId: nextPlayerId,
      faceCardRank: card.rank,
      cardsToPlay: faceCardCount,
      cardsPlayed: 0,
    };

    // Set the current player to the active player
    this.gameCore.setCurrentPlayerId(nextPlayerId);

    // Log the face card challenge start event
    this.logChallengeEvent(
      challenger.messenger.id,
      GameActionType.START_CHALLENGE,
      { card, faceCardCount }
    );

    // Notify players about the new challenge
    const nextPlayer = this.findPlayerById(nextPlayerId);
    if (nextPlayer) {
      this.notifier.emitError(
        `${challenger.name} played a face card. ${nextPlayer.name} must play ${faceCardCount} cards.`
      );
    }
  }

  /**
   * Process a card played in response to a face card challenge
   * @param player - The player who played the card
   * @param card - The card that was played
   * @returns true if the challenge continues, false if it was resolved
   */
  public handleChallengeResponse(player: Player, card: Card): boolean {
    if (!this.activeChallenge) {
      logger.warn(
        "Attempted to handle challenge response with no active challenge"
      );
      return false;
    }

    const isCounterCard = this.ruleEngine.isCounterCard(card);
    const newChallengeCount = this.ruleEngine.getFaceCardChallengeCount(card);

    // Case 1: Player countered with another face card
    if (newChallengeCount > 0) {
      this.transferChallenge(player, card, newChallengeCount);
      return true;
    }

    // Case 2: Player played a counter card (escape card)
    if (isCounterCard) {
      this.resolveCounterCardPlay(player, card);
      return false;
    }

    // Case 3: Regular card played - increment cards played count
    this.activeChallenge.cardsPlayed++;

    // Check if challenge is complete
    if (this.isChallengeComplete()) {
      this.completeChallenge();
      return false;
    }

    return true; // Challenge continues
  }

  /**
   * Handle the case when a player fails to respond to a face card challenge
   * This happens when they have no cards or time runs out
   * @param player - The player who failed to respond
   */
  public handleChallengeTimeout(player: Player): void {
    if (!(this.activeChallenge && player)) {
      logger.warn("Invalid challenge timeout handling attempt");
      return;
    }

    // Find the original challenger
    const challenger = this.findPlayerById(this.activeChallenge.initiator.id);

    if (challenger) {
      // Award pile to the original challenger
      this.awardPileToPlayer(challenger);

      // Log the failure event
      this.logChallengeEvent(
        player.messenger.id,
        GameActionType.LOSE_FACE_CARD_CHALLENGE,
        {}
      );

      // Notify players about the timeout
      this.notifier.emitError(
        `${player.name} failed to respond to the face card challenge`
      );
    }

    this.reset();
    this.gameCore.advanceTurn();
  }

  // ---- Private Helper Methods ----

  /**
   * Check if the current challenge is complete (all required cards played)
   */
  private isChallengeComplete(): boolean {
    if (!this.activeChallenge) return false;
    return (
      this.activeChallenge.cardsPlayed === this.activeChallenge.cardsToPlay
    );
  }

  /**
   * Complete a face card challenge successfully
   * This happens when all required cards are played without a counter
   */
  private completeChallenge(): void {
    if (!this.activeChallenge) return;

    // Find the challenger player
    const challenger = this.findPlayerById(this.activeChallenge.initiator.id);

    if (challenger) {
      // Challenger wins the pile
      this.awardPileToPlayer(challenger);

      // Log success event
      this.logChallengeEvent(
        challenger.messenger.id,
        GameActionType.WIN_FACE_CARD_CHALLENGE,
        {}
      );

      // Notify players about challenge completion
      this.notifier.emitError(`${challenger.name} won the face card challenge`);
    }

    this.reset();
    this.gameCore.advanceTurn();
  }

  /**
   * Transfer challenge to the next player when a face card is played
   */
  private transferChallenge(
    player: Player,
    card: Card,
    newChallengeCount: number
  ): void {
    if (!this.activeChallenge) return;

    const playerInfo = this.createPlayerInfo(player);
    const nextPlayerId = this.getNextPlayerId();

    // Update challenge state
    this.activeChallenge.initiator = playerInfo;
    this.activeChallenge.activePlayerId = nextPlayerId;
    this.activeChallenge.faceCardRank = card.rank;
    this.activeChallenge.cardsToPlay = newChallengeCount;
    this.activeChallenge.cardsPlayed = 0;

    // Set the current player to the active player
    this.gameCore.setCurrentPlayerId(nextPlayerId);

    // Log the face card challenge counter event
    this.logChallengeEvent(
      player.messenger.id,
      GameActionType.COUNTER_FACE_CARD_CHALLENGE,
      { card, newRequiredPlays: newChallengeCount }
    );

    // Notify players about the challenge transfer
    const nextPlayer = this.findPlayerById(nextPlayerId);
    if (nextPlayer) {
      this.notifier.emitError(
        `${player.name} countered with another face card. ${nextPlayer.name} must play ${newChallengeCount} cards.`
      );
    }
  }

  /**
   * Handle a counter card being played (escape card)
   */
  private resolveCounterCardPlay(player: Player, card: Card): void {
    logger.info(
      `Counter card played by ${player.name}: ${card.rank}${card.suit}`
    );

    this.reset();
    this.gameCore.advanceTurn();
  }

  /**
   * Create player info object from Player instance
   */
  private createPlayerInfo(player: Player): PlayerInfo {
    return {
      id: player.messenger.id,
      name: player.name,
      isBot: player.messenger.isBot,
    };
  }

  /**
   * Helper to log challenge events
   */
  private logChallengeEvent(
    playerId: string,
    eventType: GameActionType,
    data: Record<string, GameAction["data"]>
  ): void {
    this.eventLogger.logEvent({
      playerId,
      eventType,
      timestamp: Date.now(),
      data,
    });
  }

  /**
   * Find a player by their ID
   */
  private findPlayerById(playerId: string): Player | undefined {
    return this.gameCore.getPlayers().find((p) => p.messenger.id === playerId);
  }

  /**
   * Award the central pile to a player
   */
  private awardPileToPlayer(player: Player): void {
    const centralPile = this.gameCore.getCentralPile();
    player.addCards(centralPile);
    centralPile.length = 0; // Clear central pile
  }

  /**
   * Helper method to get the next player ID
   */
  private getNextPlayerId(): string {
    const players = this.gameCore.getPlayers();
    const currentPlayerId = this.gameCore.getCurrentPlayerId();
    const currentIndex = players.findIndex(
      (p) => p.messenger.id === currentPlayerId
    );
    const nextIndex = (currentIndex + 1) % players.length;
    return players[nextIndex].messenger.id;
  }
}
