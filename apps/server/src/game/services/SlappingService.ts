import type { Messenger } from "@oer/message";
import type { SlapRule } from "@oer/shared/types";
import { GameActionType, GameStatus } from "@oer/shared/types";
import { newLogger } from "../../logger.js";
import type { GameCore } from "../GameCore.js";
import type { GameEventLogger } from "../GameEventLogger.js";
import type { GameNotifier } from "../GameNotifier.js";
import type { Player } from "../models/Player.js";
import type { RuleEngine } from "../rules/RuleEngine.js";

const logger = newLogger("SlapManager");

/**
 * Manages all slap-related game mechanics
 */
export class SlapManager {
	private gameCore: GameCore;
	private ruleEngine: RuleEngine;
	private eventLogger: GameEventLogger;
	private notifier: GameNotifier;

	constructor(
		gameCore: GameCore,
		ruleEngine: RuleEngine,
		eventLogger: GameEventLogger,
		notifier: GameNotifier,
	) {
		this.gameCore = gameCore;
		this.ruleEngine = ruleEngine;
		this.eventLogger = eventLogger;
		this.notifier = notifier;
	}

	/**
	 * Handle a player's attempt to slap the pile
	 */
	public handleSlapAttempt(messenger: Messenger): void {
		const player = this.getPlayerByMessenger(messenger);
		if (!player) return;

		const timestamp = Date.now();
		const centralPile = this.gameCore.getCentralPile();
		const validSlap = this.ruleEngine.checkSlap(centralPile, player);

		if (validSlap) {
			this.processValidSlap(player, validSlap, timestamp);
		} else {
			this.processInvalidSlap(player, timestamp);
		}
	}

	/**
	 * Process a valid slap
	 */
	private processValidSlap(
		player: Player,
		rule: SlapRule,
		timestamp: number,
	): void {
		// Award cards to the player
		const centralPile = this.gameCore.getCentralPile();
		player.addCards(centralPile);
		centralPile.length = 0; // Clear the central pile

		// Reset any ongoing face card challenge
		this.gameCore.getFaceCardService().reset();

		// Log the successful slap event
		this.eventLogger.logEvent({
			playerId: player.messenger.id,
			eventType: GameActionType.VALID_SLAP,
			timestamp,
			data: { rule },
		});

		// Check if this player has won
		this.gameCore.getWinConditionManager().checkForWinner();

		// If no winner, continue with the next player
		if (this.gameCore.getStatus() === GameStatus.PLAYING) {
			this.gameCore.advanceTurn();
		}

		this.notifier.emitGameUpdate(this.gameCore.getGameState());
	}

	/**
	 * Process an invalid slap
	 */
	private processInvalidSlap(player: Player, timestamp: number): void {
		// Burn a card for invalid slap
		const burnedCard = player.playCard();
		if (burnedCard) {
			const centralPile = this.gameCore.getCentralPile();
			centralPile.push(burnedCard);

			// Log the invalid slap event
			this.eventLogger.logEvent({
				playerId: player.messenger.id,
				eventType: GameActionType.INVALID_SLAP,
				timestamp,
				data: { burnedCard },
			});

			this.notifier.emitGameUpdate(this.gameCore.getGameState());
		}
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
