"use client";

import { info } from "@repo/utils";
import { useState } from "react";
import WebSocketClient from "./websocket";

export default function Home(): JSX.Element {
  const [data, setData] = useState<string[]>([]);

  const handleDataReceived = (newData: string): void => {
    info("Data received", newData);
    setData((prevData) => [...prevData, newData]);
  };

  return (
    <div className="container">
      <h1 className="title">
        Egyptian Rat Screw <br />
        <span>Home</span>
      </h1>
      <h2>WebSocket</h2>
      <ul>
        {data.map((message, i) => (
          <li key={`message-${i}`}>{message}</li>
        ))}
      </ul>

      <WebSocketClient onDataReceived={handleDataReceived} />
    </div>
  );
}
