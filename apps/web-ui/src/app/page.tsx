"use client";

import { useState } from "react";
import { debug, error } from "@repo/utils";
import { useRouter } from "next/navigation";

export default function Home(): JSX.Element {
  const history = useRouter();
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState("");

  debug("Home page rendered");

  const createGame = async (): Promise<void> => {
    try {
      const response = await fetch("/api/games", {
        method: "POST",
      });
      const data: { gameId: string } = await response.json();
      history.push(`/games/${data.gameId}`);
      debug("Game created");
    } catch (e) {
      error(e);
    }
  };

  const joinGame = (): void => {
    if (!gameId) {
      alert("Please enter a game ID");
      return;
    }

    history.push(`/games/${gameId}`);
  };

  return (
    <div className="container">
      <h1 className="title">
        Egyptian Rat Screw <br />
        <span>Home</span>
      </h1>
      <input
        onChange={(e) => {
          setName(e.target.value);
        }}
        placeholder="Enter your name"
        type="text"
        value={name}
      />
      <br />
      <br />
      <input
        onChange={(e) => {
          setGameId(e.target.value);
        }}
        placeholder="Enter game id"
        type="text"
        value={gameId}
      />

      <button onClick={createGame} type="button">
        Create Game
      </button>
      <button onClick={joinGame} type="button">
        Join Game
      </button>
    </div>
  );
}
