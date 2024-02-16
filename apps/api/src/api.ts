import expressWs from "express-ws";
import type { DataPayload, GameStartedPayload } from "@repo/game-core";
import { EgyptianRatScrew } from "@repo/game-core";
import { Router } from "express";
import { info } from "@repo/utils";
import app from "./server";

expressWs(app);

const GameLobbies = new Map<string, EgyptianRatScrew>();

const router = Router();

router.get("/games", (req, res) => {
  res.json(Array.from(GameLobbies.keys()));
});

router.post("/games", (req, res) => {
  const gameId = Math.random().toString(36).substring(7);
  GameLobbies.set(gameId, new EgyptianRatScrew([]));
  res.json({ gameId });
});

router.ws("/games", (ws: WebSocket, req) => {
  ws.send(
    JSON.stringify({
      type: "lobby",
      games: Array.from(GameLobbies.keys()).map((id) => {
        const game = GameLobbies.get(id);
        return {
          id,
          name: `Game ${id}`,
          playerCount: game?.players.length ?? 0,
          maxPlayers: 4,
        };
      }),
    })
  );

  ws.addEventListener("close", () => {
    info("WebSocket disconnected");
    ws.close();
  });
});

router.ws("/games/:id", (ws: WebSocket, req) => {
  const gameId = req.params.id;
  const game = GameLobbies.get(gameId);
  const name = "Player 1";

  if (gameId !== undefined && game === undefined) {
    // Create a new game if the name has been provided
    if (name !== undefined) {
      GameLobbies.set(gameId, new EgyptianRatScrew([{ name, hand: [] }]));
      ws.send(
        JSON.stringify({
          type: "join-game",
          gameId,
          name,
        })
      );
    } else {
      ws.send(
        JSON.stringify({
          type: "lobby",
          games: Array.from(GameLobbies.keys()).map((id) => {
            const game = GameLobbies.get(id);
            return {
              id,
              name: `Game ${id}`,
              playerCount: game?.players.length ?? 0,
              maxPlayers: 4,
            };
          }),
        })
      );
    }
  }

  // After 5 seconds, start the game
  setTimeout(() => {
    game?.startGame();

    // Send the game state to all players
    const players = game?.players.map((player) => player.name);
    const scores = game?.score;
    const pile = game?.pile;
    const handSize = game?.players.find((player) => player.name === name)?.hand
      .length;
    const slapRules = game?.slapRules;
    const currentPlayer = game?.players[game?.currentPlayerIndex].name;
    const active = true;

    ws.send(
      JSON.stringify({
        type: "game-started",
        players,
        scores,
        pile,
        handSize,
        slapRules,
        currentPlayer,
        active,
      } as GameStartedPayload)
    );
  }, 5000);

  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data) as DataPayload;
    info("Data received", payload);

    const { type } = payload;

    switch (type) {
      case "join-game": {
        const { name } = payload;
        game?.players.push({
          name,
          hand: [],
        });
        break;
      }
      case "game-started": {
        game?.startGame();

        // Send the game state to all players
        const players = game?.players.map((player) => player.name);
        const scores = game?.score;
        const pile = game?.pile;
        const handSize = game?.players.find((player) => player.name === name)
          ?.hand.length;
        const slapRules = game?.slapRules;
        const currentPlayer = game?.players[game?.currentPlayerIndex].name;
        const active = true;

        ws.send(
          JSON.stringify({
            type: "game-started",
            players,
            scores,
            pile,
            handSize,
            slapRules,
            currentPlayer,
            active,
          } as GameStartedPayload)
        );

        break;
      }
      default:
        break;
    }
  };
});

export default router;
