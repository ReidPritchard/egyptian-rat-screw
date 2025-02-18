/**
 * This file defines the client-side messaging interface.
 * It provides an abstraction over the Messenger class for client usage.
 */

import { Messenger } from "./index";

/**
 * IMessageClient interface defines the contract for a messaging client.
 */
export interface IMessageClient {
  /**
   * Emits an event with associated data.
   * @param event The event name.
   * @param data The event data.
   */
  emit(event: string, data: any): void;

  /**
   * Registers a listener for a specific event.
   * @param event The event name.
   * @param listener Callback function to handle the event.
   */
  on(event: string, listener: (data: any) => void): void;

  /**
   * Disconnects the client.
   */
  disconnect(): void;
}

/**
 * MessageClient implements the IMessageClient interface
 * and wraps the Messenger functionality for client-side usage.
 */
export class MessageClient implements IMessageClient {
  private messenger: Messenger;

  /**
   * Private constructor to enforce async creation via connect.
   * @param messenger The Messenger instance.
   */
  private constructor(messenger: Messenger) {
    this.messenger = messenger;
  }

  /**
   * Connects to the specified URL and returns a MessageClient instance.
   * @param url The WebSocket URL to connect to.
   * @returns A promise that resolves to a MessageClient instance.
   */
  public static async connect(url: string): Promise<MessageClient> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(url);
      let messenger: Messenger;

      socket.onopen = () => {
        // Send initial connection request
        socket.send(JSON.stringify({ event: "connection_init" }));
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === "connection_ack" && data.data.id) {
          const id = data.data.id;
          messenger = new Messenger(false, socket, id);
          const client = new MessageClient(messenger);
          resolve(client);
        } else if (data.event === "join_room") {
          const room = data.data.room;
          console.log("Joined room", room);
          messenger.join(room);
        }
      };

      socket.onerror = (error) => {
        console.error("WebSocket connection failed", error);
        reject(new Error("WebSocket connection failed"));
      };

      // Set a reasonable timeout
      setTimeout(() => {
        if (!messenger) {
          socket.close();
          reject(new Error("Connection timeout waiting for server ID"));
        }
      }, 5000);
    });
  }

  /**
   * Emit an event to the server.
   * @param event The event name.
   * @param data The data payload.
   */
  public emit(event: string, data: any): void {
    this.messenger.emit(event, data);
  }

  /**
   * Register an event listener.
   * @param event The event name.
   * @param listener The callback function.
   */
  public on(event: string, listener: (data: any) => void): void {
    this.messenger.on(event, listener);
  }

  /**
   * Removes an event listener.
   * @param event The event name.
   * @param listener The callback function.
   */
  public off(event: string, listener: (data: any) => void): void {
    this.messenger.off(event, listener);
  }

  /**
   * Disconnect the client from the server.
   */
  public disconnect(): void {
    this.messenger.disconnect();
  }

  get isConnected(): boolean {
    return this.messenger.getIsConnected();
  }

  get id(): string {
    return this.messenger.id;
  }
}
