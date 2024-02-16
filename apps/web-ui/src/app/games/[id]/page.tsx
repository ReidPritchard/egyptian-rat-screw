"use client";

import { useCallback, useRef, useState } from "react";
import type { Card, DataPayload, EgyptianRatScrew } from "@repo/game-core";
import { info, debug } from "@repo/utils";
import WebSocketClient from "../../WSClient";

export interface GameProps {
  params: {
    id: string;
  };
}

export default function Game({ params }: GameProps): JSX.Element {
  const { id } = params;

  const ws = useRef<WebSocket | null>(null);

  // Setup client states here
  const [name, setName] = useState<string>("");
  const [players, setPlayers] = useState<string[]>([]);
  const [scores, setScores] = useState<Map<string, number>>(new Map());
  const [pile, setPile] = useState<Card[]>([]);
  const [handSize, setHandSize] = useState<number>(0);
  const [message, setMessage] = useState<string>("");
  const [slapRules, setSlapRules] = useState<EgyptianRatScrew["slapRules"]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<string>("");
  const [active, setActive] = useState<boolean>(false);

  const handleDataReceived = (event: MessageEvent<string>): void => {
    let payload;
    try {
      payload = JSON.parse(event.data);
      debug("Data received", payload);
    } catch (error) {
      debug("Error parsing data", event.data, error);
      return;
    }
    const { type } = payload as DataPayload;

    switch (type) {
      case "lobby":
        break;
      case "join-game": {
        const { name: newPlayer } = payload;
        setName(newPlayer);
        setActive(true);
        break;
      }
      case "player-joined": {
        const { name: newPlayer } = payload;
        setPlayers([...players, newPlayer]);
        break;
      }
      case "player-left": {
        const { name: gonePlayer } = payload;
        setPlayers(players.filter((p) => p !== gonePlayer));
        break;
      }
      case "game-started": {
        const {
          slapRules: gameSlapRules,
          handSize: gameHandSize,
          players: gamePlayers,
          scores: gameScores,
        } = payload;
        setActive(true);
        setSlapRules(gameSlapRules);

        setHandSize(Number(gameHandSize));
        setPile([]);
        setPlayers(gamePlayers as string[]);
        setCurrentPlayer(gamePlayers[0]);

        setScores(gameScores);
        break;
      }
      case "slap": {
        const { successful, effect } = payload;
        const {
          slapper,
          affectedPlayers,
          pile: newPile,
          message: newMessage,
        } = effect;

        info("Slap effect", effect);

        setPile(newPile);

        if (successful) {
          setMessage(`${slapper} slapped the pile!`);
        } else {
          setMessage(`${slapper} slapped the pile, but it was invalid!`);
        }

        if (affectedPlayers.includes(name)) {
          info("Affected players", affectedPlayers);
          setMessage(`${message}\n${newMessage}`);
        }
        break;
      }
      case "play-card": {
        const { card, name: player } = payload;
        info("Card played", card, player);
        if (player === name) {
          setMessage(`You played a ${card}`);
        } else {
          setMessage(`${player} played a card`);
        }
        setPile([...pile, card]);
        break;
      }
      case "error": {
        const { message: errorMessage } = payload;
        info("Error", errorMessage);
        setMessage(errorMessage);
        break;
      }
    }
  };
  const safeHandleDataReceived = useCallback(handleDataReceived, [
    message,
    name,
    pile,
    players,
  ]);

  return (
    <div>
      <div>
        <h1>Game {id}</h1>
        {active ? (
          <div>
            <div>
              <p>Players: {players.join(", ")}</p>
              <p>Current Player: {currentPlayer}</p>
              <p>Hand Size: {handSize}</p>
              <p>
                Scores:{" "}
                {Array.from(scores)
                  .map(([player, score]) => `${player}: ${score}`)
                  .join(", ")}
              </p>
              <p>Slap Rules: {JSON.stringify(slapRules)}</p>
              <p>Pile: {pile.map((c) => c.toString()).join(", ")}</p>
              <p>Message: {message}</p>
            </div>
            <button
              onClick={() => {
                debug("Play Card button clicked");
                const payload: DataPayload = {
                  type: "play-card",
                  name,
                  gameId: id,
                };
                // Send the payload to the server
                ws.current?.send(JSON.stringify(payload));
              }}
              type="button"
            >
              Play Card
            </button>
          </div>
        ) : (
          <div>
            <input
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="Enter your name"
              type="text"
              value={name}
            />
            <button
              onClick={() => {
                debug("Join Game button clicked");
                if (name) {
                  debug("Joining game", id, name);
                  const payload: DataPayload = {
                    type: "join-game",
                    name,
                    gameId: id,
                  };
                  // Send the payload to the server
                  ws.current?.send(JSON.stringify(payload));
                }
              }}
              type="button"
            >
              Join Game
            </button>
          </div>
        )}
      </div>

      <WebSocketClient
        gameId={id}
        onDataReceived={safeHandleDataReceived}
        onWebSocketConnected={(webSocket) => {
          debug("WebSocket connected");
          ws.current = webSocket;
        }}
      />
    </div>
  );
}
