"use client";

import { log } from "console";
import { useEffect } from "react";

const webSocketUrl = process.env.WS_URL || `ws://localhost:5001/api`;

export const isBrowser = typeof window !== "undefined";

export type WebSocketClientProps = {
  onDataReceived: (data: string) => void;
};

const WebSocketClient = ({ onDataReceived }: WebSocketClientProps) => {
  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const socket = new WebSocket(webSocketUrl);

    socket.onopen = () => {
      log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      onDataReceived(event.data);
    };

    socket.onclose = () => {
      log("WebSocket disconnected");
    };

    return () => {
      socket.close();
    };
  }, [onDataReceived]);

  return null;
};

export default WebSocketClient;
