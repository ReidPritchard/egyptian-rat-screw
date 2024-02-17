"use client";

import { useState } from "react";
import { debug, error } from "@repo/utils";
import { useRouter } from "next/navigation";

export default function Home(): JSX.Element {
  const history = useRouter();
  const [name, setName] = useState("");
  const [gameId, setGameId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  debug("Home page rendered");

  const createGame = (): void => {
    setLoading(true);
    fetch("/api/games", {
      method: "POST",
    })
      .then((response) => response.json())
      .then((data: { gameId: string }) => {
        history.push(`/games/${data.gameId}`);
        debug("Game created");
        setLoading(false);
      })
      .catch((e) => {
        error("Error creating game", e);
        setLoading(false);
      });
  };

  const joinGame = (): void => {
    setLoading(true);
    if (!gameId) {
      setErrorMessage("Please enter a game ID");
      setLoading(false);
      return;
    }
    setErrorMessage("");

    history.push(`/games/${gameId}`);
    setLoading(false);
  };

  return (
    <div className="container">
      <header>
        <h1 className="title">Egyptian Rat Screw</h1>
        <h2>Home</h2>
      </header>
      <main>
        <section id="name-input-container">
          <label htmlFor="name-input">Enter your name</label>
          <input
            id="name-input"
            onChange={(e) => {
              setName(e.target.value);
            }}
            placeholder="Enter your name"
            type="text"
            value={name}
          />
        </section>
        <section id="game-id-input-container">
          <label htmlFor="game-id-input">Enter game id</label>
          <input
            id="game-id-input"
            onChange={(e) => {
              setGameId(e.target.value);
            }}
            placeholder="Enter game id"
            type="text"
            value={gameId}
          />
          {errorMessage ? <p style={{ color: "red" }}>{errorMessage}</p> : null}
        </section>
        <section id="action-buttons-container">
          <button disabled={loading} onClick={createGame} type="button">
            Create Game
          </button>
          <button disabled={loading} onClick={joinGame} type="button">
            Join Game
          </button>
        </section>
      </main>
      <footer />
    </div>
  );
}
