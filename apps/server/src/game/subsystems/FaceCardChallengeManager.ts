import type { Card, PlayerInfo } from "@oer/shared/types";
import { GameEventType } from "@oer/shared/types";
import { newLogger } from "../../logger.js";
import { FaceCardChallenge } from "../FaceCardChallenge.js";
import type { GameCore } from "../GameCore.js";
import type { GameEventLogger } from "../GameEventLogger.js";
import type { GameNotifier } from "../GameNotifier.js";
import type { Player } from "../Player.js";
import type { RuleEngine } from "../rules/RuleEngine.js";

const logger = newLogger("FaceCardChallengeManager");

/**
 * Manages the face card challenge mechanic in the game
 */
export class FaceCardChallengeManager {
  private gameCore: GameCore;
  private ruleEngine: RuleEngine;
  private eventLogger: GameEventLogger;
  private notifier: GameNotifier;
  private faceCardChallenge: FaceCardChallenge | null = null;

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
    this.faceCardChallenge = null;
  }

  /**
   * Start a new face card challenge
   */
  public startChallenge(challenger: Player, challengeCount: number): void {
    const challengerInfo: PlayerInfo = {
      id: challenger.messenger.id,
      name: challenger.name,
      isBot: challenger.messenger.isBot,
    };

    this.faceCardChallenge = new FaceCardChallenge(
      challengerInfo,
      challengeCount,
      this.getNextPlayerId()
    );

    // Log the face card challenge start event
    this.eventLogger.logEvent({
      playerId: challenger.messenger.id,
      eventType: GameEventType.START_CHALLENGE,
      timestamp: Date.now(),
      data: {},
    });
  }

  /**
   * Get the current face card challenge state
   */
  public getFaceCardChallengeState(): {
    challenger: PlayerInfo;
    currentPlayerId: string;
    remainingPlays: number;
  } | null {
    if (!this.faceCardChallenge) return null;

    return {
      challenger: this.faceCardChallenge.getChallenger(),
      currentPlayerId: this.faceCardChallenge.getCurrentPlayerId(),
      remainingPlays: this.faceCardChallenge.getRemainingPlays(),
    };
  }

  /**
   * Process a card played in response to a face card challenge
   */
  public handleChallengeResponse(player: Player, card: Card): void {
    if (!this.faceCardChallenge) return;

    const isCounterCard = this.ruleEngine.isCounterCard(card);
    const challengeCount = this.ruleEngine.getFaceCardChallengeCount(card);

    if (isCounterCard || challengeCount > 0) {
      // Counter successful - next player must respond
      const playerInfo: PlayerInfo = {
        id: player.messenger.id,
        name: player.name,
        isBot: player.messenger.isBot,
      };

      this.faceCardChallenge.updateCounter(
        playerInfo,
        challengeCount,
        this.getNextPlayerId()
      );

      // Log the face card challenge counter event
      this.eventLogger.logEvent({
        playerId: player.messenger.id,
        eventType: GameEventType.COUNTER_FACE_CARD_CHALLENGE,
        timestamp: Date.now(),
        data: { card },
      });
    } else {
      const isComplete = this.faceCardChallenge.decrementPlays(
        this.getNextPlayerId()
      );

      if (isComplete) {
        // Challenge completed successfully
        this.resolveChallengeSuccess();
      }
    }
  }

  /**
   * Handle the case when a player fails to counter a face card challenge
   */
  public resolveChallengeFailure(player: Player): void {
    if (!this.faceCardChallenge) return;

    // Failed to counter - challenger wins
    const challenger = this.gameCore
      .getPlayers()
      .find(
        (p) => p.messenger.id === this.faceCardChallenge?.getChallenger().id
      );

    if (challenger) {
      const centralPile = this.gameCore.getCentralPile();
      challenger.addCards(centralPile);
      centralPile.length = 0; // Clear central pile

      // Log the face card challenge failure event
      this.eventLogger.logEvent({
        playerId: player.messenger.id,
        eventType: GameEventType.LOSE_FACE_CARD_CHALLENGE,
        timestamp: Date.now(),
        data: {},
      });
    }

    this.faceCardChallenge = null;
    this.gameCore.advanceTurn();
  }

  /**
   * Process a successful face card challenge
   */
  private resolveChallengeSuccess(): void {
    if (!this.faceCardChallenge) return;

    // Find the challenger player
    const challenger = this.gameCore
      .getPlayers()
      .find(
        (p) => p.messenger.id === this.faceCardChallenge?.getChallenger().id
      );

    if (challenger) {
      // Give the challenger all cards in the central pile
      const centralPile = this.gameCore.getCentralPile();
      challenger.addCards(centralPile);
      centralPile.length = 0; // Clear central pile

      // Log success event
      this.eventLogger.logEvent({
        playerId: challenger.messenger.id,
        eventType: GameEventType.WIN_FACE_CARD_CHALLENGE,
        timestamp: Date.now(),
        data: {},
      });
    }

    this.faceCardChallenge = null;
    this.gameCore.advanceTurn();
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
