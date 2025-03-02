import type { Messenger } from "@oer/message";
import { GameEventType } from "@oer/shared/types";
import { newLogger } from "../../logger.js";
import type { GameCore } from "../GameCore.js";
import type { GameEventLogger } from "../GameEventLogger.js";
import type { GameNotifier } from "../GameNotifier.js";
import type { Player } from "../Player.js";
import type { RuleEngine } from "../rules/RuleEngine.js";

const logger = newLogger("CardPlayManager");

/**
 * Handles all logic related to playing cards during normal gameplay
 */
export class CardPlayManager {
  private gameCore: GameCore;
  private ruleEngine: RuleEngine;
  private eventLogger: GameEventLogger;
  private notifier: GameNotifier;

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
   * Handles a player's attempt to play a card
   */
  public handlePlayCard(messenger: Messenger): void {
    const player = this.getPlayerByMessenger(messenger);
    if (player) {
      this.playCard(player);
    }
  }

  /**
   * Process the action of playing a card
   */
  private playCard(player: Player): void {
    const players = this.gameCore.getPlayers();
    const currentPlayerId = this.gameCore.getCurrentPlayerId();

    // Verify it's the player's turn
    if (player.messenger.id !== currentPlayerId) {
      player.messenger.emit("error", "Not your turn.");
      return;
    }

    // Play the card
    const card = player.playCard();
    if (!card) {
      player.messenger.emit("error", "No cards to play.");
      return;
    }

    // Add the card to the central pile
    const centralPile = this.gameCore.getCentralPile();
    centralPile.push(card);

    // Log the event
    this.eventLogger.logEvent({
      playerId: player.messenger.id,
      eventType: GameEventType.PLAY_CARD,
      timestamp: Date.now(),
      data: { card },
    });

    // Check for face card challenge
    const challengeCount = this.ruleEngine.getFaceCardChallengeCount(card);
    if (challengeCount > 0) {
      // Notify the face card challenge manager
      this.gameCore
        .getFaceCardChallengeManager()
        .startChallenge(player, challengeCount);
    } else {
      // Advance to the next player
      this.gameCore.advanceTurn();
    }

    // Update all clients
    this.notifier.emitGameUpdate(this.gameCore.getGameState());
  }

  /**
   * Get a player by their messenger object
   */
  private getPlayerByMessenger(messenger: Messenger): Player | undefined {
    return this.gameCore
      .getPlayers()
      .find((p) => p.messenger.id === messenger.id);
  }
}
