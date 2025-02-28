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
  notifyServer(event: EventName, data: EventData): void;

  /**
   * Notify/trigger local listeners of an event.
   * @param event The event name.
   * @param data The event data.
   */
  notifyLocal(event: EventName, data: EventData): void;

  /**
   * Notify both the server and local listeners of an event.
   * @param event The event name.
   * @param data The event data.
   */
  broadcast(event: EventName, data: EventData): void;

  /**
   * Registers a listener for a specific event.
   * @param event The event name.
   * @param listener Callback function to handle the event.
   */
  on(event: EventName, listener: (data: EventData) => void): void;

  /**
   * Disconnects the client.
   */
  disconnect(): void;

  /**
   * Indicates whether the client is connected to the server.
   */
  readonly isConnected: boolean;

  /**
   * Returns the client's ID.
   */
  readonly id: string;
}

/**
 * MessageClient implements the IMessageClient interface
 * and wraps the Messenger functionality for client-side usage.
 */
export class MessageClient implements IMessageClient {
  /**
   * The Messenger instance.
   */
  private readonly messenger: Messenger;

  /**
   * A map of event names to their listeners.
   */
  private readonly eventHandlers: Map<
    EventName,
    Set<(data: EventData) => void>
  > = new Map();

  /**
   * Private constructor to enforce async creation via connect.
   * @param messenger The Messenger instance.
   */
  constructor(messenger: Messenger) {
    this.messenger = messenger;
  }

  /**
   * Notify the server of an event.
   */
  public notifyServer(event: EventName, data: EventData): void {
    logger.debug("Notifying server", { data: { event, data } });
    this.messenger.emit(event, data);
  }

  /**
   * Notify/trigger local listeners of an event.
   */
  public notifyLocal(event: EventName, data: EventData): void {
    const handlers = this.eventHandlers.get(event);
    if (!handlers?.size) {
      logger.debug("No handlers for event", { data: { event } });
      return;
    }

    logger.debug("Notifying local handlers", {
      data: { event, handlersCount: handlers.size },
    });
    for (const handler of handlers) {
      handler(data);
    }
  }

  /**
   * Notify both the server and local listeners of an event.
   */
  public broadcast(event: EventName, data: EventData): void {
    logger.info("Broadcasting event");
    this.notifyServer(event, data);
    this.notifyLocal(event, data);
  }

  /**
   * Register an event listener both locally and with the messenger.
   */
  public on(event: EventName, listener: (data: EventData) => void): void {
    // Initialize handler set if it doesn't exist
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());

      // Set up messenger event handler for non-socket events
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
    logger.debug("Added event listener", { data: { event } });
  }

  /**
   * Removes an event listener from both local handlers and messenger.
   */
  public off(event: EventName, listener: (data: EventData) => void): void {
    this.messenger.off(event, listener);
    this.eventHandlers.get(event)?.delete(listener);
    logger.debug("Removed event listener", { data: { event } });
  }

  /**
   * Disconnect the client from the server.
   */
  public disconnect(): void {
    this.messenger.disconnect();
    this.eventHandlers.clear();
    logger.debug("Client disconnected");
  }

  public get isConnected(): boolean {
    return this.messenger.getIsConnected();
  }

  public get id(): string {
    return this.messenger.id;
  }
}

export const connectMessageClient = async (
  url: string
): Promise<MessageClient> => {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    let connectionAckReceived = false;
    const connectionTimeout = 5000;

    // Handle initial connection
    socket.addEventListener("open", () => {
      logger.debug("WebSocket connection opened");
      socket.send(JSON.stringify({ event: MessengerEvents.CONNECTION_INIT }));
    });

    // Single message handler for both connection setup and regular messages
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      logger.debug("WebSocket message received", { data });

      if (!connectionAckReceived) {
        // Handle initial connection acknowledgment
        if (data.event === MessengerEvents.CONNECTION_ACK && data.data.id) {
          connectionAckReceived = true;
          const messenger = new Messenger(false, socket, data.data.id);
          const client = new MessageClient(messenger);
          logger.debug("MessageClient created", { data: client.id });
          resolve(client);

          // After client is created, handle all subsequent messages
          socket.addEventListener("message", (msgEvent) => {
            const msgData = JSON.parse(msgEvent.data);
            client.notifyLocal(msgData.event, msgData.data);
          });
        }
      }
    });

    // Error handling
    socket.addEventListener("error", (error) => {
      const errorMsg = "WebSocket connection failed";
      logger.error(errorMsg, { data: error });
      reject(new Error(errorMsg));
    });

    socket.addEventListener("close", () => {
      logger.debug("WebSocket connection closed");
      if (!connectionAckReceived) {
        reject(new Error("Connection closed before initialization"));
      }
    });

    // Connection timeout
    setTimeout(() => {
      if (!connectionAckReceived) {
        socket.close();
        reject(new Error("Connection timeout waiting for server ID"));
      }
    }, connectionTimeout);
  });
};
