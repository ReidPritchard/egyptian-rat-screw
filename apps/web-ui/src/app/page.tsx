"use client";

import { log } from "@repo/logger";
import { CounterButton, Link } from "@repo/ui";
import { useState, useEffect } from "react";

export default function Store(): JSX.Element {
  const [messages, setMessages] = useState<string[]>([]);

  // Connect to the WebSocket server
  const [ws] = useState(new WebSocket(`ws://localhost:5001/api`));

  useEffect(() => {
    ws.onopen = () => {
      log("Connected to the WebSocket server");
    };

    ws.onmessage = (event) => {
      log(`Received message from server: ${event.data}`);
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    ws.onclose = () => {
      log("Disconnected from the WebSocket server");
    };
  }, [ws]);

  return (
    <div className="container">
      <h1 className="title">
        Egyptian Rat Screw <br />
        <span>Home</span>
      </h1>
      <h2>WebSocket</h2>
      <p>
        <button
          onClick={() => {
            ws?.send("Hello, Server!");
          }}
        >
          Send Message to Server
        </button>
      </p>
      <ul>
        {messages.map((message, i) => (
          <li key={i}>{message}</li>
        ))}
      </ul>
    </div>
  );
}
