"use client";

import { useState } from "react";
import WebSocketClient from "../../WSClient";

export interface GameProps {
  params: {
    id: string;
  };
}

export default function Game({ params }: GameProps): JSX.Element {
  const { id } = params;

  const [data, setData] = useState<string[]>([]);

  const handleDataReceived = (event: MessageEvent): void => {
    const data = event.data;
  };

  return (
    <div>
      <h1>Game: {id}</h1>
      <ul>
        {data.map((message, i) => (
          <li key={`message-${i}`}>{message}</li>
        ))}
      </ul>
      <WebSocketClient gameId={id} onDataReceived={handleDataReceived} />
    </div>
  );
}
