import type { Socket } from "socket.io";
import { SETTINGS } from "../config.js";

/**
 * The messenger is an abstraction layer for a player/bot's socket logic.
 * It will be the interface for the game to interact with to notify the player/bot of events.
 */
export class Messenger {
  private isBot: boolean;

  /**
   * The ID of the player/bot.
   */
  public id: string;

  /**
   * The socket of the player. Only used if the messenger is a player.
   * Otherwise the socket is undefined.
   */
  private socket: Socket | undefined;

  /**
   * Maps event names to their corresponding listeners.
   * Only used if the messenger is a bot. Otherwise the socket is used directly.
   */
  private listeners: Map<string, (data: any) => void> = new Map();

  /**
   * Rooms the player is in. Only used if the messenger is a bot.
   * Otherwise the rooms are managed by the socket.
   */
  private rooms: Set<string> = new Set();

  constructor(isBot: boolean, socket?: Socket) {
    this.isBot = isBot;
    this.socket = socket;
    this.id = socket?.id ?? this.generateId();
  }

  private generateId(): string {
    const adjectives = SETTINGS.GENERATORS.PLAYER_NAME.ADJECTIVES;
    const nouns = SETTINGS.GENERATORS.PLAYER_NAME.NOUNS;
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${nouns[Math.floor(Math.random() * nouns.length)]}`;
  }

  public emitToPlayer(event: string, data: any): void {
    if (this.isBot === false) {
      this.socket?.emit(event, data);
    } else {
      this.emit(event, data);
    }
  }

  public on(event: string, listener: (data: any) => void): void {
    if (this.isBot === false) {
      this.socket?.on(event, listener);
    } else {
      this.listeners.set(event, listener);
    }
  }

  public off(event: string, listener: (data: any) => void): void {
    if (this.isBot === false) {
      this.socket?.off(event, listener);
    } else {
      this.listeners.delete(event);
    }
  }

  public emit(event: string, data: any): void {
    const listener = this.listeners.get(event);
    if (listener) {
      listener(data);
    }
  }

  public join(room: string): void {
    if (this.isBot === false) {
      this.socket?.join(room);
    } else {
      this.rooms.add(room);
    }
  }

  public leave(room: string): void {
    if (this.isBot === false) {
      this.socket?.leave(room);
    } else {
      this.rooms.delete(room);
    }
  }

  public getRooms(): string[] {
    return Array.from(this.rooms);
  }
}
