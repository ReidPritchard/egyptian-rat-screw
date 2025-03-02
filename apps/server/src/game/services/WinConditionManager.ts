import { GameActionType, type PlayerInfo } from "@oer/shared/types";
import { newLogger } from "../../logger.js";
import type { GameCore } from "../GameCore.js";
import type { GameEventLogger } from "../GameEventLogger.js";
import type { GameNotifier } from "../GameNotifier.js";

const logger = newLogger("WinConditionManager");

/**
 * Manages game win conditions and detecting winners
 */
export class WinConditionManager {
  private gameCore: GameCore;
  private eventLogger: GameEventLogger;
  private notifier: GameNotifier;

  constructor(
    gameCore: GameCore,
    eventLogger: GameEventLogger,
    notifier: GameNotifier
  ) {
    this.gameCore = gameCore;
    this.eventLogger = eventLogger;
    this.notifier = notifier;
  }

  /**
   * Check if the game has a winner
   */
  public checkForWinner(): void {
    const players = this.gameCore.getPlayers();
    const activePlayers = players.filter((p) => p.getCardCount() > 0);

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      const winnerInfo: PlayerInfo = {
        id: winner.messenger.id,
        name: winner.name,
        isBot: winner.messenger.isBot,
      };

      // Log the game end event
      this.eventLogger.logEvent({
        playerId: winner.messenger.id,
        eventType: GameActionType.END_GAME,
        timestamp: Date.now(),
        data: { winner: winnerInfo },
      });

      // Set the winner in the GameCore
      this.gameCore.setWinner(winnerInfo);
    }
  }

  /**
   * Check if a player is eliminated
   */
  public isPlayerEliminated(playerId: string): boolean {
    const players = this.gameCore.getPlayers();
    const player = players.find((p) => p.messenger.id === playerId);

    return player ? player.getCardCount() === 0 : true;
  }
}
