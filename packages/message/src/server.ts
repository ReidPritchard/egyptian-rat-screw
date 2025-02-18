/**
 * This file defines the server-side messaging interface.
 * It provides an abstraction over the Room and Messenger classes for server usage.
 */

import type { Messenger } from "./index.js";
import { Room } from "./index.js";

/**
 * IMessageServer interface defines the contract for a messaging server.
 */
export interface IMessageServer {
  /**
   * Registers a messenger (client) to the server.
   * @param messenger The messenger to register.
   */
  register(messenger: Messenger): void;

  /**
   * Unregisters a messenger (client) from the server.
   * @param messenger The messenger to unregister.
   */
  unregister(messenger: Messenger): void;

  /**
   * Creates a new room with the given parameters.
   * @param id Unique identifier for the room
   * @param name Display name for the room
   * @param maxSize Maximum number of messengers allowed in the room
   * @returns The created room
   */
  createRoom(id: string, name: string, maxSize: number): Room;

  /**
   * Gets a room by its ID.
   * @param roomId The room ID to look up
   * @returns The room if found, undefined otherwise
   */
  getRoom(roomId: string): Room | undefined;

  /**
   * Moves a messenger from one room to another.
   * @param messenger The messenger to move
   * @param toRoomId The target room ID
   * @returns true if successful, false otherwise
   */
  moveMessengerToRoom(messenger: Messenger, toRoomId: string): boolean;

  /**
   * Removes a messenger from their current room.
   * @param messenger The messenger to remove from their room
   */
  removeMessengerFromRoom(messenger: Messenger): void;

  /**
   * Gets the room a messenger is currently in.
   * @param messenger The messenger to look up
   * @returns The room the messenger is in, or undefined if not in any room
   */
  getMessengerRoom(messenger: Messenger): Room | undefined;

  /**
   * Broadcasts an event to all registered messengers.
   * @param event The event name.
   * @param data The data payload.
   * @param excludeMessenger Optional messenger to exclude from broadcast.
   */
  broadcast(event: string, data: any, excludeMessenger?: Messenger): void;

  /**
   * Disconnects all registered messengers.
   */
  disconnectAll(): void;
}

/**
 * MessageServer implements the IMessageServer interface and manages messengers and their communication.
 * It maintains rooms for organizing messengers and facilitating communication.
 */
export class MessageServer implements IMessageServer {
  /**
   * The set of all messengers registered to the server.
   */
  private messengers: Set<Messenger> = new Set();

  /**
   * Map of room IDs to Room instances.
   */
  private rooms: Map<string, Room> = new Map();

  /**
   * Map of messenger IDs to their current room.
   */
  private messengerRooms: Map<string, Room> = new Map();

  /**
   * The lobby room for unassigned messengers.
   */
  private lobbyRoom: Room;

  /**
   * Creates a MessageServer instance.
   * A lobby room is initialized to manage unassigned messengers.
   */
  constructor() {
    this.lobbyRoom = new Room("lobby", "Lobby", Number.POSITIVE_INFINITY);
    this.rooms.set(this.lobbyRoom.getId(), this.lobbyRoom);
  }

  /**
   * Gets the lobby room instance.
   * @returns The lobby room instance.
   */
  public getGlobalRoom(): Room {
    return this.lobbyRoom;
  }

  /**
   * Creates a new room with the given parameters.
   */
  public createRoom(id: string, name: string, maxSize: number): Room {
    if (this.rooms.has(id)) {
      throw new Error(`Room with ID ${id} already exists`);
    }
    const room = new Room(id, name, maxSize);
    this.rooms.set(id, room);
    return room;
  }

  /**
   * Gets a room by its ID.
   */
  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  /**
   * Gets the room a messenger is currently in.
   */
  public getMessengerRoom(messenger: Messenger): Room | undefined {
    return this.messengerRooms.get(messenger.id);
  }

  /**
   * Moves a messenger from one room to another.
   */
  public moveMessengerToRoom(messenger: Messenger, toRoomId: string): boolean {
    const targetRoom = this.rooms.get(toRoomId);
    if (!targetRoom) {
      return false;
    }

    // Remove from current room if in one
    this.removeMessengerFromRoom(messenger);

    // Add to new room
    const success = targetRoom.addMessenger(messenger);
    if (success) {
      this.messengerRooms.set(messenger.id, targetRoom);
      messenger.join(targetRoom.getId());
      messenger.emit("join_room", { room: targetRoom.getId() });
    }
    return success;
  }

  /**
   * Removes a messenger from their current room.
   */
  public removeMessengerFromRoom(messenger: Messenger): void {
    const currentRoom = this.messengerRooms.get(messenger.id);
    if (currentRoom) {
      currentRoom.removeMessenger(messenger);
      this.messengerRooms.delete(messenger.id);
    }
  }

  /**
   * Registers a messenger to the server and places them in the lobby.
   */
  public register(messenger: Messenger): void {
    // Handle connection initialization if this is a new messenger
    if (!this.messengers.has(messenger)) {
      messenger.emit("connection_ack", { id: messenger.id });
    }

    this.messengers.add(messenger);
    this.moveMessengerToRoom(messenger, this.lobbyRoom.getId());
  }

  /**
   * Unregisters a messenger from the server and removes them from any room.
   */
  public unregister(messenger: Messenger): void {
    this.removeMessengerFromRoom(messenger);
    this.messengers.delete(messenger);
  }

  /**
   * Broadcasts an event to all messengers in the server.
   */
  public broadcast(
    event: string,
    data: any,
    excludeMessenger?: Messenger
  ): void {
    for (const messenger of this.messengers) {
      if (messenger !== excludeMessenger) {
        messenger.emit(event, data);
      }
    }
  }

  /**
   * Disconnects all registered messengers and cleans up all rooms.
   */
  public disconnectAll(): void {
    for (const messenger of this.messengers) {
      messenger.disconnect();
    }

    // Clear all rooms
    for (const room of this.rooms.values()) {
      room.clear();
    }
    this.rooms.clear();

    // Reset internal state
    this.messengers.clear();
    this.messengerRooms.clear();

    // Recreate lobby
    this.lobbyRoom = new Room("lobby", "Lobby", Number.POSITIVE_INFINITY);
    this.rooms.set(this.lobbyRoom.getId(), this.lobbyRoom);
  }
}
