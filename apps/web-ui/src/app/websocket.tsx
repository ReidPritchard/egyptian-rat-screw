"use client";

import { debug } from "@repo/utils";
import { useEffect } from "react";

const webSocketUrl = `ws://localhost:5001/api/game/123?name=player1`;

export const isBrowser = typeof window !== "undefined";

export interface WebSocketClientProps {
  onDataReceived: (data: string) => void;
}

function WebSocketClient({
  onDataReceived,
}: WebSocketClientProps): JSX.Element | null {
  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const socket = new WebSocket(webSocketUrl);

    socket.onopen = () => {
      debug("WebSocket connected");
    };

    socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      const { message } = data;
      onDataReceived(message);
    };

    socket.onclose = () => {
      debug("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, [onDataReceived]);

  return null;
}

export default WebSocketClient;
