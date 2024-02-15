"use client";

import { info } from "@repo/logger";
import { useState } from "react";
import WebSocketClient from "./websocket";

export default function Store(): JSX.Element {
  const [data, setData] = useState<string[]>([]);

  const handleDataReceived = (newData: string) => {
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
          <li key={i}>{message}</li>
        ))}
      </ul>

      <WebSocketClient onDataReceived={handleDataReceived} />
    </div>
  );
}
