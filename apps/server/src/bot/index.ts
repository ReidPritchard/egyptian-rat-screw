import type { Messenger } from "@oer/message";
import type { ClientGameState, PlayerInfo } from "@oer/shared/types";
import type { Game } from "../game/Game.js";
import { newLogger } from "../logger.js";

const logger = newLogger("Bot");

export class Bot {
  private id: string;
  private game: Game | null = null;
  public playerInfo: PlayerInfo;
  public messenger: Messenger;

  constructor(messenger: Messenger, name = "Bot") {
    this.id = `bot-${Math.random().toString(36).slice(2, 15)}`;
    logger.info(`Creating bot: ${name} with id: ${this.id}`);

    this.playerInfo = {
      id: this.id,
      name: name,
      isBot: true,
    };

    this.messenger = messenger;
  }

  public joinGame(gameId: string): void {
    if (this.game) {
      logger.info(`Bot ${this.playerInfo.name} joined game ${gameId}`);
      this.setupGameListeners();
    } else {
      logger.error(`Failed to join game ${gameId}`);
    }
  }

  private setupGameListeners(): void {
    if (!this.messenger) return;

    // Listen for game state updates
    this.messenger.on("gameStateUpdated", (gameState) => {
      this.handleGameStateUpdate(gameState);
    });

    // Add more listeners as needed
  }

  private handleGameStateUpdate(gameState: ClientGameState): void {
    // Check if it's the bot's turn
    if (gameState.currentPlayerId === this.playerInfo.id) {
      this.playTurn();
    }

    // Add logic for slapping, etc.
  }

  private playTurn(): void {
    if (!this.messenger) return;
  }

  // Add more methods for bot decision-making, such as when to slap, etc.
}
