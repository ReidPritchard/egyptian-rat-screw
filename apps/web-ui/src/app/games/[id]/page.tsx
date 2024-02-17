"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isDataPayload } from "@repo/game-core";
import type {
  Card,
  DataPayload,
  EgyptianRatScrew,
  JoinGamePayload,
  PlayCardPayload,
} from "@repo/game-core";
import { info, debug } from "@repo/utils";
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

  useEffect(() => {
    if (isDataPayload(lastMessage)) {
      let payload;
      try {
        payload = JSON.parse(lastMessage.data);
        debug("Data received", payload);
        handleDataReceived(payload);
      } catch (error) {
        debug("Error parsing data", lastMessage.data, error);
      }
    }
  }, [lastMessage]);

  const handleDataReceived = (payload: DataPayload): void => {
    const { type } = payload;

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
        setPlayers(gamePlayers);
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
        if (card !== undefined) {
          info("Card played", card, player);
          if (player === name) {
            setMessage(`You played a ${card.toString()}`);
          } else {
            setMessage(`${player} played a card`);
          }
          setPile([...pile, card]);
          // Next player's turn
          const nextPlayerIndex =
            (players.indexOf(currentPlayer) + 1) % players.length;
          setCurrentPlayer(players[nextPlayerIndex]);
        } else {
          // This should never happen
          debug("Card is undefined", payload);
          throw new Error("Card is undefined");
        }
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

  const handlePlayCard = useCallback(() => {
    debug("Play Card button clicked");
    const payload: PlayCardPayload = {
      type: "play-card",
      name,
    };
    // Send the payload to the server
    sendMessage(JSON.stringify(payload));
  }, [id, name, sendMessage]);

  const handleJoinGame = useCallback(() => {
    debug("Join Game button clicked");
    if (name !== undefined && name !== "") {
      debug("Joining game", id, name);
      const payload: JoinGamePayload = {
        type: "join-game",
        name,
        gameId: id,
      };
      // Send the payload to the server
      sendMessage(JSON.stringify(payload));
      // I think instead of sending a message to the server,
      // we should change the webSocket url to the new game ID
      // TODO: Only change the socketUrl if the game ID has changed
      // setSocketUrl(`ws://localhost:5001/games/${id}`);
    }
  }, [id, name]);

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
