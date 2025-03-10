import { Messenger } from "@oer/message";
import { SocketEvents } from "@oer/shared/socketEvents";
import {
  type ClientGameState,
  GameStatus,
  type PlayerInfo,
  PlayerStatus,
} from "@oer/shared/types";
import { Player } from "../game/models/Player.js";
import { newLogger } from "../logger.js";
import { GameManager } from "../manager/GameManager.js";
import { generatePlayerName } from "../manager/utils.js";

const logger = newLogger("Bot");

const BotDifficulty = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
} as const;

type BotDifficulty = (typeof BotDifficulty)[keyof typeof BotDifficulty];

const playCardDelay = {
  [BotDifficulty.EASY]: () => Math.floor(Math.random() * 2000) + 1000,
  [BotDifficulty.MEDIUM]: () => Math.floor(Math.random() * 1000) + 500,
  [BotDifficulty.HARD]: () => Math.floor(Math.random() * 500) + 250,
} as const;

const slapPileDelay = {
  [BotDifficulty.EASY]: () => Math.floor(Math.random() * 2000) + 1000,
  [BotDifficulty.MEDIUM]: () => Math.floor(Math.random() * 1000) + 500,
  [BotDifficulty.HARD]: () => Math.floor(Math.random() * 500) + 250,
} as const;

const slapPileAccuracy = {
  [BotDifficulty.EASY]: () => Math.random() < 0.5,
  [BotDifficulty.MEDIUM]: () => Math.random() < 0.75,
  [BotDifficulty.HARD]: () => Math.random() < 0.9,
} as const;

export class Bot extends Player {
  private id: string;
  public playerInfo: PlayerInfo;

  private difficulty: BotDifficulty;

  constructor(name?: string, difficulty: BotDifficulty = BotDifficulty.EASY) {
    const botName = name || generatePlayerName();
    super(new Messenger(true), botName, true);

    this.id = this.messenger.id;
    this.difficulty = difficulty;

    logger.info(`Creating bot: ${botName} with id: ${this.id}`);

    this.playerInfo = {
      id: this.id,
      name: botName,
      isBot: true,
    };
    this.messenger.setData("playerInfo", this.playerInfo);

    this.setupGameListeners();
  }

  private setupGameListeners(): void {
    logger.info(`Setting up game listeners for bot: ${this.playerInfo.name}`);

    if (!this.messenger) return;

    // Listen for game state updates
    this.messenger.on(SocketEvents.GAME_STATE_UPDATED, (gameState) => {
      logger.info(`Game state updated for bot: ${this.playerInfo.name}`);
      this.handleGameStateUpdate(gameState);
    });
  }

  private handleGameStateUpdate(gameState: ClientGameState): void {
    // Handle Pre-game
    if (gameState.status === GameStatus.PRE_GAME) {
      logger.info(`Bot ${this.playerInfo.name} is in pre-game`);

      // Check if the bot is already ready
      if (
        gameState.players.find((player) => player.id === this.playerInfo.id)
          ?.status === PlayerStatus.READY
      ) {
        return;
      }

      // Check if any players are ready
      const players = gameState.players;
      const readyPlayers = players.filter(
        (player) => player.status === PlayerStatus.READY
      );
      if (readyPlayers.length > 0) {
        GameManager.getInstance().handlePlayerReady(this.messenger);
      }
    }

    // Check if it's the bot's turn
    logger.info(
      `Bot ${this.playerInfo.name} is turn: ${gameState.currentPlayerId} === ${this.id}`
    );
    if (gameState.currentPlayerId === this.id) {
      logger.info(`Bot ${this.playerInfo.name}'s turn`);

      setTimeout(() => {
        this.playTurn();
      }, playCardDelay[this.difficulty]());
    }

    // Check if the bot should slap the pile
    // TODO: Use the rule engine to determine if there are any valid slaps
  }

  private playTurn(): void {
    if (!this.messenger) return;

    // Play a card
    GameManager.getInstance().handlePlayCard(this.messenger);
  }
}
