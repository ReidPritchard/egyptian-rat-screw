import type { Messenger } from "@oer/message";
import { newLogger } from "../../logger.js";
import type { GameCore } from "../GameCore.js";
import type { GameEventLogger } from "../GameEventLogger.js";
import type { GameNotifier } from "../GameNotifier.js";
import type { Player } from "../models/Player.js";
import type { RuleEngine } from "../rules/RuleEngine.js";

const logger = newLogger("CardPlayManager");

/**
 * Handles all logic related to playing cards during normal gameplay in Egyptian Ratscrew
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
   * @param messenger - The messenger object of the player attempting to play
   */
  public handlePlayCard(messenger: Messenger): void {
    const player = this.getPlayerByMessenger(messenger);
    if (!player) {
      logger.warn(`Player with ID ${messenger.id} not found`);
      return;
    }

    this.playCard(player);
  }

  /**
   * Process the action of playing a card
   * @param player - The player playing a card
   */
  private playCard(player: Player): void {
    const currentPlayerId = this.gameCore.getCurrentPlayerId();
    const fcService = this.gameCore.getFaceCardService();

    // Check if the player is allowed to play a card
    if (player.messenger.id !== currentPlayerId) {
      logger.warn(`Player ${player.messenger.id} is not the current player`);
      return;
    }

    // Check if the player has any cards left
    if (player.getCardCount() === 0) {
      logger.warn(`Player ${player.messenger.id} has no cards left`);
      return;
    }

    // Get the card that the player is playing
    const card = player.playCard();
    if (!card) {
      logger.error(
        `Player ${player.messenger.id} has no card to play! This should never happen!`
      );
      return;
    }

    // Add the card to the central pile
    this.gameCore.getCentralPile().push(card);

    // Handle the card play
    fcService.handleCardPlay(player, card);

    // Update all clients
    this.notifier.emitGameUpdate(this.gameCore.getGameState());
  }

  /**
   * Get a player by their messenger object
   * @param messenger - The messenger object to lookup
   * @returns The player associated with the messenger, or undefined if not found
   */
  private getPlayerByMessenger(messenger: Messenger): Player | undefined {
    return this.gameCore
      .getPlayers()
      .find((p) => p.messenger.id === messenger.id);
  }
}
