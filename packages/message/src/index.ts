/**
 * This file provides the core messaging abstractions for both client and server usage.
 */

import { SETTINGS } from "@oer/configuration";

/**
 * Type for event data
 */
export type EventData = any;

/**
 * Type for additional data for a messenger
 */
export type AdditionalData = Map<string, any>;

/**
 * Type for event listener functions
 */
export type EventListener = (data: EventData) => void;

/**
 * Shared event names for the Messenger class
 */
export const MessengerEvents = {
  CONNECTION_INIT: "connection_init",
  CONNECTION_ACK: "connection_ack",
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  ERROR: "error",
};

/**
 * Messenger is a core class that handles event emission, listener management, and room coordination.
 * It is environment agnostic.
 */
export class Messenger {
  /**
   * Whether this messenger represents a bot
   */
  public readonly isBot: boolean;

  /**
   * Unique identifier for the messenger
   */
  public readonly id: string;

  /**
   * The socket instance, if applicable. Client-specific socket creation is handled elsewhere.
   */
  private socket: WebSocket | undefined;

  /**
   * Maps event names to their corresponding listeners
   */
  private listeners: Map<string, Set<EventListener>> = new Map();

  /**
   * Tracks the rooms this messenger has joined
   */
  private rooms: Set<string> = new Set();

  /**
   * Indicates whether the messenger is still connected
   */
  private isConnected = true;

  /**
   * Any additional data we want to associate with this messenger
   * In the context of OER, this could contain the player info
   */
  private data: AdditionalData = new Map();

  /**
   * Constructs a new Messenger.
   * @param isBot - Whether the messenger represents a bot.
   * @param socket - The WebSocket instance (required for non-bot messengers).
   * @throws Error if a non-bot messenger is created without a socket.
   */
  constructor(isBot: boolean, socket?: WebSocket, id?: string) {
    this.isBot = isBot;
    this.socket = socket;
    this.id = id || this.generateId();

    if (!(isBot || socket)) {
      throw new Error("Socket must be provided for non-bot messengers");
    }
  }

  /**
   * Generates a unique identifier using configuration-defined adjectives and nouns.
   */
  private generateId(): string {
    const adjectives = SETTINGS.GENERATORS.PLAYER_NAME.ADJECTIVES;
    const nouns = SETTINGS.GENERATORS.PLAYER_NAME.NOUNS;
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${
      nouns[Math.floor(Math.random() * nouns.length)]
    }`;
  }

  /**
   * Emits an event with associated data.
   * For non-bot messengers with a socket, sends a JSON-stringified message.
   * Otherwise, it uses the internal listener mechanism.
   * @param event - The event name.
   * @param data - The event data.
   * @throws Error if the messenger is disconnected.
   */
  public emit(event: string, data: EventData): void {
    if (!this.isConnected) {
      throw new Error("Cannot emit to disconnected messenger");
    }

    if (!this.isBot && this.socket) {
      this.socket.send(JSON.stringify({ event, data }));
    } else {
      this.notifyLocal(event, data);
    }
  }

  /**
   * Registers a listener for a specified event.
   * For messengers with a socket, attaches a message listener; otherwise, registers internally.
   * @param event - The event name.
   * @param listener - The callback function.
   */
  public on(event: string, listener: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(listener);
  }

  /**
   * Removes a specific listener for an event.
   * @param event - The event name.
   * @param listener - The listener to remove.
   */
  public off(event: string, listener: EventListener): void {
    if (!this.isBot && this.socket) {
      if ((this.socket as any).removeEventListener) {
        (this.socket as any).removeEventListener("message", listener);
      } else if ((this.socket as any).removeListener) {
        (this.socket as any).removeListener("message", listener);
      }
    } else {
      this.listeners.get(event)?.delete(listener);
      if (this.listeners.get(event)?.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Removes all listeners for a given event.
   * @param event - The event name.
   */
  public removeAllListeners(event: string): void {
    if (!this.isBot && this.socket) {
      if ((this.socket as any).removeAllListeners) {
        (this.socket as any).removeAllListeners("message");
      } else if ((this.socket as any).removeEventListener) {
        // Fallback: remove by setting listener to a no-op
        (this.socket as any).removeEventListener("message", () => {});
      }
    } else {
      this.listeners.delete(event);
    }
  }

  /**
   * Emits an event to all internally registered listeners.
   * @param event - The event name.
   * @param data - The event data.
   */
  public notifyLocal(event: string, data: EventData): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in listener for event ${event}:`, error);
        }
      }
    } else {
      console.warn(`No listeners for event ${event}`);
    }
  }

  /**
   * Joins a room identified by a given ID.
   * @param room - The room ID to join.
   * @returns true if the room was joined; false if already a member.
   */
  public join(room: string): boolean {
    const wasAdded = !this.rooms.has(room);
    this.rooms.add(room);
    return wasAdded;
  }

  /**
   * Leaves a room identified by a given ID.
   * @param room - The room ID to leave.
   * @returns true if the room was left; false if not a member.
   */
  public leave(room: string): boolean {
    return this.rooms.delete(room);
  }

  /**
   * Retrieves all rooms the messenger has joined.
   * @returns An array of room IDs.
   */
  public getRooms(): string[] {
    return Array.from(this.rooms);
  }

  /**
   * Checks whether the messenger is part of a specific room.
   * @param room - The room ID to check.
   * @returns true if in the room; false otherwise.
   */
  public isInRoom(room: string): boolean {
    return this.rooms.has(room);
  }

  /**
   * Disconnects the messenger, clearing all room memberships and listeners.
   */
  public disconnect(): void {
    this.isConnected = false;
    this.rooms.clear();
    this.listeners.clear();
    if (!this.isBot && this.socket) {
      this.socket.close();
    }
  }

  /**
   * Checks if the messenger is still connected.
   * @returns true if connected; false otherwise.
   */
  public getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Gets the data associated with the messenger
   * @returns the data
   */
  public getData(key?: string): any {
    if (key) {
      return this.data.get(key);
    }
    return this.data;
  }

  /**
   * Sets the data associated with the messenger
   * @param key - The key to set the data for
   * @param value - The value to set
   */
  public setData(key: string, value: any): void {
    this.data.set(key, value);
  }

  /**
   * Creates a bot messenger instance.
   * This method is environment agnostic.
   * @returns a new Messenger configured as a bot.
   */
  public static createBot(): Messenger {
    return new Messenger(true);
  }
}

/**
 * Room represents a collection of messengers for group communication.
 */
export class Room {
  /**
   * The messengers in the room
   */
  private messengers: Set<Messenger> = new Set();

  /**
   * Any other data we want to associate with the room
   * In the context of OER, this could contain the game instance
   */
  private data: AdditionalData = new Map();

  /**
   * Hooks for room events. Currently only one hook per event.
   * @example
   * const room = new Room("room1", "Room 1", 4);
   * room.addHook("addMessenger", (messenger) => {
   *   console.log("Messenger added to room:", messenger.id);
   * });
   */
  private hooks: Map<
    "addMessenger" | "removeMessenger",
    (messenger: Messenger) => void
  > = new Map();

  /**
   * Constructs a new Room instance.
   * @param id - The unique identifier for the room.
   * @param roomName - The display name of the room.
   * @param roomSize - Maximum number of messengers allowed (default is 4).
   */
  constructor(
    private readonly id: string,
    public readonly roomName: string,
    public readonly roomSize = 4
  ) {}

  /**
   * Retrieves the unique room identifier.
   * @returns the room ID.
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Adds a messenger to the room if there is capacity and if not already added.
   * @param messenger - The messenger to add.
   * @returns true if the messenger was added; false otherwise.
   */
  public addMessenger(messenger: Messenger): boolean {
    const canAdd =
      !this.messengers.has(messenger) && this.messengers.size < this.roomSize;

    if (canAdd) {
      this.messengers.add(messenger);
      messenger.join(this.id);

      this.hooks.get("addMessenger")?.(messenger);

      console.log("Added messenger to room:", {
        room: this.id,
        messenger: messenger.id,
      });
      return true;
    }
    return false;
  }

  /**
   * Removes a messenger from the room.
   * @param messenger - The messenger to remove.
   * @returns true if the messenger was removed; false otherwise.
   */
  public removeMessenger(messenger: Messenger): boolean {
    const wasRemoved = this.messengers.delete(messenger);
    messenger.leave(this.id);

    this.hooks.get("removeMessenger")?.(messenger);

    console.log("Removed messenger from room:", {
      room: this.id,
      messenger: messenger.id,
    });
    return wasRemoved;
  }

  /**
   * Gets an array of all messengers in the room.
   * @returns an array of Messenger instances.
   */
  public getMessengers(): Messenger[] {
    return Array.from(this.messengers);
  }

  /**
   * Gets the current number of messengers in the room.
   * @returns the room size (number of messengers).
   */
  public getSize(): number {
    return this.messengers.size;
  }

  /**
   * Checks if a given messenger is in the room.
   * @param messenger - The messenger to check.
   * @returns true if present; false otherwise.
   */
  public hasMessenger(messenger: Messenger): boolean {
    return this.messengers.has(messenger);
  }

  /**
   * Gets the data associated with the room
   * @returns the data
   */
  public getData(key?: string): any {
    if (key) {
      return this.data.get(key);
    }
    return this.data;
  }

  /**
   * Sets the data associated with the room
   * @param key - The key to set the data for
   * @param value - The value to set
   */
  public setData(key: string, value: any): void {
    this.data.set(key, value);
  }

  /**
   * Broadcasts an event to all messengers in the room, with an option to exclude a specific messenger.
   * @param event - The event name.
   * @param data - The event data.
   * @param excludeMessengers - Optional messenger(s) to exclude from the broadcast.
   */
  public emit(
    event: string,
    data: EventData,
    excludeMessengers?: Messenger[]
  ): void {
    for (const messenger of this.messengers) {
      if (!(excludeMessengers?.includes(messenger))) {
        messenger.emit(event, data);
      }
    }
  }

  /**
   * Adds a hook for a room event.
   * @param event - The event name.
   * @param hook - The hook to add.
   */
  public addHook(
    event: "addMessenger" | "removeMessenger",
    hook: (messenger: Messenger) => void
  ): void {
    this.hooks.set(event, hook);
  }

  /**
   * Removes a hook for a room event.
   * @param event - The event name.
   */
  public removeHook(event: "addMessenger" | "removeMessenger"): void {
    this.hooks.delete(event);
  }

  /**
   * Clears all messengers from the room.
   */
  public clear(): void {
    for (const messenger of this.messengers) {
      messenger.leave(this.id);
    }
    this.messengers.clear();
  }
}
