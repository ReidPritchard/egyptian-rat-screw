/**
 * This file defines the client-side messaging interface.
 * It provides an abstraction over the Messenger class for client usage.
 */

import { newLogger } from "@/logger";
import { type EventData, Messenger, MessengerEvents } from "@oer/message";
import { SocketEvents } from "@oer/shared/socketEvents";

export type EventName = SocketEvents | keyof typeof MessengerEvents | string;

const logger = newLogger("MessageClient");

/**
 * IMessageClient interface defines the contract for a messaging client.
 */
export interface IMessageClient {
  /**
   * Notify the server of an event.
   * @param event The event name.
   * @param data The event data.
   */
  notifyServer(event: string, data: EventData): void;

  /**
   * Notify/trigger local listeners of an event.
   * @param event The event name.
   * @param data The event data.
   */
  notifyLocal(event: string, data: EventData): void;

  /**
   * Notify both the server and local listeners of an event.
   * @param event The event name.
   * @param data The event data.
   */
  broadcast(event: string, data: EventData): void;

  /**
   * Registers a listener for a specific event.
   * @param event The event name.
   * @param listener Callback function to handle the event.
   */
  on(event: string, listener: (data: EventData) => void): void;

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
  /**
   * The Messenger instance.
   */
  private messenger: Messenger;

  /**
   * A map of event names to their listeners.
   */
  private eventHandlers: Map<string, Set<(data: EventData) => void>> =
    new Map();

  /**
   * Private constructor to enforce async creation via connect.
   * @param messenger The Messenger instance.
   */
  constructor(messenger: Messenger) {
    this.messenger = messenger;
  }

  /**
   * Notify the server of an event.
   * @param event The event name.
   * @param data The event data.
   */
  public notifyServer(event: string, data: EventData): void {
    logger.info("NOTIFYING SERVER", { data: { event, data } });
    this.messenger.emit(event, data);
  }

  /**
   * Notify/trigger local listeners of an event.
   * @param event The event name.
   * @param data The event data.
   */
  public notifyLocal(event: string, data: EventData): void {
    logger.info("NOTIFYING LOCAL", { data: { event, data } });
    const handlers = this.eventHandlers.get(event);

    if (!handlers) {
      logger.warn("No handlers for event", { data: { event } });
      return;
    }

    for (const handler of handlers) {
      handler(data);
    }
  }

  /**
   * Notify both the server and local listeners of an event.
   * @param event The event name.
   * @param data The event data.
   */
  public broadcast(event: string, data: EventData): void {
    logger.info("BROADCASTING ================================");
    this.notifyServer(event, data);
    this.notifyLocal(event, data);
    logger.info("BROADCASTED ================================");
  }
  /**
   * Register an event listener both locally and with the messenger.
   * @param event The event name.
   * @param listener The callback function.
   */
  public on(event: EventName, listener: (data: EventData) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());

      // Set up messenger event handler if it's not a special event
      if (event !== SocketEvents.CONNECT && event !== SocketEvents.DISCONNECT) {
        this.messenger.on(event, (data: EventData) => {
          const handlers = this.eventHandlers.get(event);
          if (handlers) {
            for (const handler of handlers) {
              handler(data);
            }
          }
        });
      }
    }

    this.eventHandlers.get(event)?.add(listener);
  }

  /**
   * Removes an event listener from both local handlers and messenger.
   * @param event The event name.
   * @param listener The callback function.
   */
  public off(event: string, listener: (data: EventData) => void): void {
    this.messenger.off(event, listener);
    this.eventHandlers.get(event)?.delete(listener);
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

export const connectMessageClient = async (
  url: string
): Promise<MessageClient> => {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    let connectionAckReceived = false;

    socket.onopen = () => {
      logger.info("WebSocket connection opened");
      // We have to use the socket directly here as the Messenger class
      // can't be initialized until the server has sent the connection ID
      socket.send(JSON.stringify({ event: MessengerEvents.CONNECTION_INIT }));
    };

    socket.onmessage = (event) => {
      logger.info("WebSocket message received", { data: event });
      const data = JSON.parse(event.data);

      if (data.event === MessengerEvents.CONNECTION_ACK && data.data.id) {
        logger.info("Connection ACK received", { data: data.data.id });
        connectionAckReceived = true;
        const id = data.data.id;
        const messenger = new Messenger(false, socket, id);
        const client = new MessageClient(messenger);
        logger.info("MessageClient created", { data: client.id });

        // Change `onmessage` to notify the local client handlers
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          client.notifyLocal(data.event, data.data);
        };

        resolve(client);
      }
    };

    socket.onerror = (error) => {
      logger.error("WebSocket connection failed", { data: error });
      reject(new Error("WebSocket connection failed"));
    };

    setTimeout(() => {
      if (!connectionAckReceived) {
        socket.close();
        reject(new Error("Connection timeout waiting for server ID"));
      }
    }, 5000);
  });
};
