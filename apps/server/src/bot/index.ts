import { Socket } from 'socket.io';
import { Game } from '../game/Game';
import { newLogger } from '../logger';
import { PlayerActionType, PlayerInfo } from '../types';
import { Messenger } from '../game/Messenger';

const logger = newLogger('Bot');

export class Bot {
  private id: string;
  private game: Game | null = null;
  public playerInfo: PlayerInfo;
  public messenger: Messenger;

  constructor(name: string = 'Bot') {
    this.id = `bot-${Math.random().toString(36).slice(2, 15)}`;
    logger.info(`Creating bot: ${name} with id: ${this.id}`);

    this.playerInfo = {
      id: this.id,
      name: name,
      isBot: true,
    };
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
    this.messenger.on('gameStateUpdated', (gameState) => {
      this.handleGameStateUpdate(gameState);
    });

    // Add more listeners as needed
  }

  private handleGameStateUpdate(gameState: any): void {
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
