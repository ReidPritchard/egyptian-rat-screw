"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isDataPayload, PlayerGame } from "@oers/game-core";
import type {
  Card,
  DataPayload,
  EgyptianRatScrew,
  JoinGamePayload,
  PlayCardPayload,
  SlapRule,
  PlayerGameOptions,
} from "@oers/game-core";
import { info, debug } from "@oers/utils";
import { GameCard } from "@oers/ui";
import useWebSocket, { ReadyState } from "react-use-websocket";

export interface GameProps {
  params: {
    id: string;
  };
}

export default function Game({ params }: GameProps): JSX.Element {
  const { id } = params;
  const [socketUrl, setSocketUrl] = useState(`ws://localhost:5001/games/${id}`);
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);
  const [name, setName] = useState<string>("");

  // Setup client states here
  const [playerState, setPlayerState] = useState<PlayerGame>(
    new PlayerGame({ gameId: id, name } as PlayerGameOptions)
  );

  const {
    players,
    scores,
    pile,
    handSize,
    message,
    slapRules,
    currentPlayer,
    active,
  } = playerState;

  const handleDataReceived = useCallback((payload: DataPayload): void => {
    setPlayerState((prevState: PlayerGame) => {
      const updatedPlayerState = new PlayerGame(prevState);
      updatedPlayerState.handleDataReceived(payload);
      // If any of the properties of the playerState have changed, we need to update the state
      // Check if any of the properties have changed
      if (prevState.serialize() !== updatedPlayerState.serialize()) {
        debug("Player state updated", updatedPlayerState);
        return updatedPlayerState;
      }
      // If no properties have changed, return the previous state
      return prevState;
    });
  }, []);

  useEffect(() => {
    if (lastMessage?.data && isDataPayload(lastMessage)) {
      try {
        const payload = JSON.parse(lastMessage.data);
        debug("Data received", payload);
        handleDataReceived(payload as DataPayload);
      } catch (error) {
        debug("Error parsing data", lastMessage.data, error);
      }
    }
  }, [handleDataReceived, lastMessage]);

  const handlePlayCard = useCallback(() => {
    debug("Play Card button clicked");
    const payload = playerState.generatePayload("play-card");
    sendMessage(JSON.stringify(payload));
  }, [playerState, sendMessage]);

  const handleJoinGame = useCallback(() => {
    if (!name.trim()) {
      debug("Name is required to join the game");
      return;
    }

    debug("Join Game button clicked", id, name);
    playerState.name = name;
    const payload = playerState.generatePayload("join-game");

    // Send the payload to the server
    sendMessage(JSON.stringify(payload));

    // Only change the socketUrl if the game ID has changed
    if (socketUrl !== `ws://localhost:5001/games/${id}`) {
      setSocketUrl(`ws://localhost:5001/games/${id}`);
    }
  }, [id, name, playerState, sendMessage, socketUrl]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: "Connecting",
    [ReadyState.OPEN]: "Open",
    [ReadyState.CLOSING]: "Closing",
    [ReadyState.CLOSED]: "Closed",
    [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  }[readyState];

  return (
    <div>
      <div>
        <h1>Game {id}</h1>
        <p>Connection Status: {connectionStatus}</p>
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
              <p>Slap Rules: {slapRules.map((rule) => rule.name).join(", ")}</p>
              <p>
                Pile: {pile.map((c) => `${c.value} of ${c.suit}`).join(", ")}
              </p>
              <div>
                <GameCard card={{ suit: "hearts", value: "A" }} />
                <GameCard card={{ suit: "spades", value: "2" }} />
                <GameCard card={{ suit: "hearts", value: "3" }} />
              </div>
              <p>Message: {message}</p>
            </div>
            <button
              disabled={readyState !== ReadyState.OPEN}
              onClick={handlePlayCard}
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
              disabled={readyState !== ReadyState.OPEN}
              onClick={handleJoinGame}
              type="button"
            >
              Join Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
