"use client";

import { debug } from "@repo/utils";
import { useEffect } from "react";

const webSocketUrl = (gameId: string): string =>
  `ws://localhost:5001/games/${gameId}`;

export const isBrowser = typeof window !== "undefined";

export interface WebSocketClientProps {
  onDataReceived: (data: MessageEvent) => void;
  onWebSocketConnected: (webSocket: WebSocket) => void;
  gameId: string;
}

function WebSocketClient({
  onDataReceived,
  onWebSocketConnected,
  gameId,
}: WebSocketClientProps): JSX.Element | null {
  useEffect(() => {
    debug("Running WebSocketClient effect");
    if (!isBrowser) {
      return;
    }

    const socket = new WebSocket(webSocketUrl(gameId));

    socket.onopen = () => {
      debug("WebSocket connected");
      onWebSocketConnected(socket);
    };

    socket.onmessage = (event: MessageEvent) => {
      onDataReceived(event);
    };

    socket.onclose = () => {
      debug("WebSocket disconnected");
      socket.close();
    };

    return () => {
      debug("Cleaning up WebSocketClient effect");
      socket.close();
    };
  }, [gameId, onDataReceived, onWebSocketConnected]);

  return null;
}

export default WebSocketClient;
