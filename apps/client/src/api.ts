import type { EventData } from "@oer/message";
import {
  type IChangeNamePayload,
  type ICreateGamePayload,
  type IJoinGamePayload,
  type ILeaveGamePayload,
  type IPlayCardPayload,
  type ISlapPilePayload,
  SocketEvents,
} from "@oer/shared/socketEvents";
import type { GameSettings, PlayerAction, PlayerInfo } from "@oer/shared/types";
import { config } from "./config";
import { newLogger } from "./logger";
import {
  type EventName,
  type MessageClient,
  connectMessageClient,
} from "./message/client";

export class Api {
  private messageClient_: MessageClient | null = null;
  private logger = newLogger("api");

  private constructor() {
    this.logger.info("Api instance created");
  }

  public static async initialize(): Promise<Api> {
    const api = new Api();
    api.messageClient_ = await connectMessageClient(config.serverUrl);
    api.logger.info("WebSocket connection initialized");
    return api;
  }

  get messageClient(): MessageClient {
    if (!this.messageClient_) {
      throw new Error("MessageClient not initialized");
    }
    return this.messageClient_;
  }

  changeName(payload: IChangeNamePayload) {
    this.messageClient.notifyServer(SocketEvents.CHANGE_NAME, payload);
  }

  joinLobby() {
    this.messageClient.notifyServer(SocketEvents.JOIN_LOBBY, {});
  }

  joinGame(payload: IJoinGamePayload) {
    this.messageClient.notifyServer(SocketEvents.JOIN_GAME, payload);
  }

  createGame(payload: ICreateGamePayload) {
    this.messageClient.notifyServer(SocketEvents.CREATE_GAME, payload);
  }

  leaveGame(payload?: ILeaveGamePayload) {
    this.messageClient.notifyServer(SocketEvents.LEAVE_GAME, payload);
  }

  playCard(payload: IPlayCardPayload) {
    this.messageClient.notifyServer(SocketEvents.PLAY_CARD, payload);
  }

  slapPile(payload: Partial<ISlapPilePayload>) {
    if (!payload.playerId) {
      this.logger.error("Invalid payload", {
        data: { error: "playerId is required", payload },
      });
      throw new Error("playerId is required");
    }

    this.messageClient.notifyServer(SocketEvents.SLAP_PILE, payload);
  }

  playerReady(payload: PlayerInfo) {
    this.messageClient.notifyServer(SocketEvents.PLAYER_READY, payload);
  }

  playerAction(action: PlayerAction) {
    this.messageClient.notifyServer(SocketEvents.PLAYER_ACTION, action);
  }

  setGameSettings(settings: GameSettings) {
    const payload = { settings };
    this.messageClient.notifyServer(SocketEvents.SET_GAME_SETTINGS, payload);
  }

  startVote(topic: string) {
    const payload = { topic };
    this.messageClient.notifyServer(SocketEvents.VOTE_STARTED, payload);
  }

  submitVote(vote: boolean) {
    const payload = { vote };
    this.messageClient.notifyServer(SocketEvents.VOTE_UPDATED, payload);
  }

  on(event: EventName, callback: (data: EventData) => void): void {
    this.logger.debug("Adding event listener", { data: { event } });
    this.messageClient.on(event, callback);
  }

  off(event: SocketEvents, callback: (data: EventData) => void): void {
    this.logger.debug("Removing event listener", { data: { event } });
    this.messageClient.off(event, callback);
  }

  disconnect() {
    this.logger.info("Disconnecting from server");
    this.messageClient.disconnect();
  }
}

export const initializeApi = async (): Promise<Api> => {
  return Api.initialize();
};
