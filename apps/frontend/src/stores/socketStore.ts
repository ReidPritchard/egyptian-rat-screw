import { writable } from "svelte/store";

interface SocketStore {
  subscribe: (run: (value: WebSocket | null) => void) => () => void;
  subscribeMessage: (run: (value: MessageEvent | null) => void) => () => void;
  set: (value: WebSocket) => void;
  connect: (url: string) => Promise<void>;
  disconnect: () => void;
  send: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
}

/**
 * Creates a socket store object that manages the WebSocket connection and provides methods for connecting, disconnecting, and sending data.
 * @returns The socket store object.
 */
function createSocketStore(): SocketStore {
  const { subscribe, set, update } = writable<WebSocket | null>(null);
  const { subscribe: subscribeMessage, set: setMessage } =
    writable<MessageEvent | null>(null);

  return {
    set,
    subscribe,
    connect(url: string) {
      const socket = new WebSocket(url);
      console.log("Connecting to socket", url);
      socket.onopen = () => set(socket);
      socket.onerror = (error) => console.error("Socket error:", error);
      socket.onmessage = setMessage;
      socket.onclose = () => {
        set(null);
        setMessage(null);
      };

      return new Promise<void>((resolve) => {
        socket.onopen = () => {
          set(socket);
          resolve();
        };
      });
    },
    disconnect() {
      update((socket) => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.close();
        }
        return null;
      });
    },
    send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
      subscribe((socket) => {
        if (socket?.readyState === WebSocket.OPEN) {
          try {
            socket.send(data);
          } catch (error) {
            console.error("Failed to send data: ", error);
          }
        }
      })();
    },
    subscribeMessage,
  };
}

export const socketStore = createSocketStore();
