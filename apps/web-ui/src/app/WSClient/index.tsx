"use client";

import { debug } from "@repo/utils";
import { useEffect } from "react";

const webSocketUrl = (gameId: string): string =>
  `ws://localhost:5001/api/games/${gameId}`;

export const isBrowser = typeof window !== "undefined";

export interface WebSocketClientProps {
  onDataReceived: (data: MessageEvent) => void;
  gameId: string;
}

function WebSocketClient({
  onDataReceived,
  gameId,
}: WebSocketClientProps): JSX.Element | null {
  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const socket = new WebSocket(webSocketUrl(gameId));

    socket.onopen = () => {
      debug("WebSocket connected");
    };

    socket.onmessage = (event: MessageEvent) => {
      onDataReceived(event);
    };

    socket.onclose = () => {
      debug("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, [gameId, onDataReceived]);

  return null;
}

export default WebSocketClient;
