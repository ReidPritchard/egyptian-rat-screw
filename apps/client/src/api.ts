import { config } from "./config";
import { newLogger } from "./logger";
import {
  type ChangeNamePayload,
  type CreateGamePayload,
  type JoinGamePayload,
  type LeaveGamePayload,
  type PlayCardPayload,
  type SlapPilePayload,
  SocketEvents,
} from "@oer/shared";
import type { GameSettings, PlayerAction, PlayerInfo } from "@oer/shared";
import { MessageClient } from "@oer/message/client";

export class Api {
  private messenger_: MessageClient | null = null;
  private logger = newLogger("api");
  private eventHandlers: Map<SocketEvents, Set<(...args: any[]) => void>> =
    new Map();

  private constructor() {
    this.logger.info("Api instance created");
  }

  public static async initialize(): Promise<Api> {
    const api = new Api();
    api.messenger_ = await MessageClient.connect(config.serverUrl);
    api.logger.info("WebSocket connection initialized");
    return api;
  }

  get messenger(): MessageClient {
    if (!this.messenger_) {
      throw new Error("Messenger not initialized");
    }
    return this.messenger_;
  }

  private emit(event: SocketEvents, ...args: any[]) {
    this.logger.debug("Emitting event", { data: { event, args } });
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(...args);
      }
    }
  }

  changeName(payload: ChangeNamePayload) {
    this.logger.info("Emitting event", {
      data: { event: SocketEvents.CHANGE_NAME, payload },
    });
    this.messenger.emit(SocketEvents.CHANGE_NAME, payload);
  }

  joinLobby() {
    this.logger.info("Emitting event", {
      data: { event: SocketEvents.JOIN_LOBBY },
    });
    this.messenger.emit(SocketEvents.JOIN_LOBBY, {});
  }

  joinGame(payload: JoinGamePayload) {
    this.logger.info("Emitting event", {
      data: { event: SocketEvents.JOIN_GAME, payload },
    });
    this.messenger.emit(SocketEvents.JOIN_GAME, payload);
  }

  createGame(payload: CreateGamePayload) {
    this.logger.info("Emitting event", {
      data: { event: SocketEvents.CREATE_GAME, payload },
    });
    this.messenger.emit(SocketEvents.CREATE_GAME, payload);
  }

  leaveGame(payload: LeaveGamePayload) {
    this.logger.info("Emitting event", {
      data: { event: SocketEvents.LEAVE_GAME, payload },
    });
    this.messenger.emit(SocketEvents.LEAVE_GAME, payload);
  }

  playCard(payload: PlayCardPayload) {
    this.logger.info("Emitting event", {
      data: { event: SocketEvents.PLAY_CARD, payload },
    });
    this.messenger.emit(SocketEvents.PLAY_CARD, payload);
  }

  slapPile(payload: Partial<SlapPilePayload>) {
    if (!payload.playerId) {
      this.logger.error("Invalid payload", {
        data: { error: "playerId is required", payload },
      });
      throw new Error("playerId is required");
    }

    this.logger.info("Emitting event", {
      data: { event: SocketEvents.SLAP_PILE, payload },
    });
    this.messenger.emit(SocketEvents.SLAP_PILE, payload);
  }

  playerReady(payload: PlayerInfo) {
    this.logger.info("Emitting event", {
      data: { event: SocketEvents.PLAYER_READY, payload },
    });
    this.messenger.emit(SocketEvents.PLAYER_READY, payload);
  }

  playerAction(action: PlayerAction) {
    this.logger.info("Emitting event", {
      data: { event: SocketEvents.PLAYER_ACTION, payload: action },
    });
    this.messenger.emit(SocketEvents.PLAYER_ACTION, action);
  }

  setGameSettings(settings: GameSettings) {
    const payload = { settings };
    this.logger.info("Emitting event", {
      data: { event: SocketEvents.SET_GAME_SETTINGS, payload },
    });
    this.messenger.emit(SocketEvents.SET_GAME_SETTINGS, payload);
  }

  startVote(topic: string) {
    const payload = { topic };
    this.logger.info("Emitting event", {
      data: { event: SocketEvents.VOTE_STARTED, payload },
    });
    this.messenger.emit(SocketEvents.VOTE_STARTED, payload);
  }

  submitVote(vote: boolean) {
    const payload = { vote };
    this.logger.info("Emitting event", {
      data: { event: SocketEvents.VOTE_UPDATED, payload },
    });
    this.messenger.emit(SocketEvents.VOTE_UPDATED, payload);
  }

  on(event: SocketEvents, callback: (...args: any[]) => void): void {
    this.logger.debug("Adding event listener", { data: { event } });

    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());

      // Set up messenger event handler if it's not a special event
      if (event !== SocketEvents.CONNECT && event !== SocketEvents.DISCONNECT) {
        this.messenger.on(event, (...args: any[]) => {
          this.logger.debug("Received event", { data: { event, args } });
          this.emit(event, ...args);
        });
      }
    }

    this.eventHandlers.get(event)?.add(callback);
  }

  off(event: SocketEvents, callback: (...args: any[]) => void): void {
    this.logger.debug("Removing event listener", { data: { event } });
    this.eventHandlers.get(event)?.delete(callback);
  }
}

export const initializeApi = async (): Promise<Api> => {
  return Api.initialize();
};
