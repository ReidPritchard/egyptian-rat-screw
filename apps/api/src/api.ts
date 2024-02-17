import expressWs from "express-ws";
import type {
  DataPayload,
  GameStartedPayload,
  PlayCardPayload,
  Player,
} from "@repo/game-core";
import { EgyptianRatScrew } from "@repo/game-core";
import { Router } from "express";
import { info, debug } from "@repo/utils";
import app from "./server";

expressWs(app);

const GameLobbies = new Map<string, EgyptianRatScrew>();
const GameClients = new Map<string, WebSocket[]>();

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
  info("WebSocket connection opened for game", req.params.id);
  const gameId = req.params.id;
  let game = GameLobbies.get(gameId);
  const playerName: string | undefined = req.query.playerName as
    | string
    | undefined;
  const gameName: string | undefined = req.query.gameName as string | undefined;

  if (!game && playerName) {
    // Create a new game if the player name has been provided
    GameLobbies.set(
      gameId,
      new EgyptianRatScrew([{ name: playerName, hand: [] }])
    );
    GameClients.set(gameId, [ws]);
    ws.send(
      JSON.stringify({
        type: "join-game",
        gameId,
        gameName,
        playerName,
      })
    );
  } else if (!game) {
    ws.send(
      JSON.stringify({
        type: "lobby",
        games: Array.from(GameLobbies.keys()).map((id) => {
          const aGame = GameLobbies.get(id);
          return {
            id,
            name: `Game ${id}`,
            playerCount: aGame?.players.length ?? 0,
            maxPlayers: 4,
          };
        }),
      })
    );
  }

  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data) as DataPayload;
    info("Data received", payload);

    const { type } = payload;

    switch (type) {
      case "join-game": {
        const { name } = payload;

        const alreadyJoined =
          game?.players.find((player: Player) => player.name === name) !==
          undefined;
        if (alreadyJoined) {
          const allPlayers = game.players.map((player: Player) => player.name);
          debug("Player already joined", allPlayers.join(", "));
          return;
        }

        game = createGame(gameId, name, ws, gameName);

        debug("Sending player-joined event to all players except", name);
        GameClients.get(gameId)?.forEach((client) => {
          if (client !== ws) {
            client.send(
              JSON.stringify({
                type: "player-joined",
                name,
              })
            );
          } else {
            // Send the game state to the player who joined
            const gameState = getGameState(game, name);
            const response = JSON.stringify(gameState);
            ws.send(response);
          }
        });
        break;
      }
      case "game-started": {
        debug("Game started by player", playerName);
        if (playerName === undefined || game.active) {
          debug(
            playerName === undefined ? "No player name" : "Game already active"
          );
          return;
        }

        game.startGame();

        // Send the game state to all players
        const gameState = getGameState(game, playerName);
        const response = JSON.stringify(gameState);
        GameClients.get(gameId)?.forEach((client) => {
          client.send(response);
        });
        break;
      }
      case "play-card": {
        // The card won't be in the payload as the client doesn't know their hand
        const player = game.players.find((p: Player) => p.name === playerName);
        if (player) {
          const card = game.playCard(player);
          // Send the play-card event to all players
          const response: PlayCardPayload = {
            type: "play-card",
            playerName,
            card,
          };
          GameClients.get(gameId)?.forEach((client) => {
            client.send(JSON.stringify(response));
          });
        }
        break;
      }
      default:
        break;
    }
  };

  ws.onclose = () => {
    info("WebSocket disconnected");
    if (game) {
      game.players = game.players.filter(
        (player: Player) => player.name !== playerName
      );
      GameClients.set(
        gameId,
        GameClients.get(gameId)?.filter((client) => client !== ws) ?? []
      );
      if (game.players.length === 0) {
        GameLobbies.delete(gameId);
      }
    }
  };
});

/**
 * If the game doesn't exist, create a new game with the provided player name.
 * @param gameId - The ID of the game.
 * @param playerName - The name of the player.
 * @returns The game that was created.
 */
function createGame(
  gameId: string,
  playerName: string,
  webSocket: WebSocket,
  _gameName?: string // TODO: Improve support for game names
): EgyptianRatScrew {
  let game = GameLobbies.get(gameId);
  if (!game) {
    game = new EgyptianRatScrew([]);
    GameLobbies.set(gameId, game);
  }
  // If the game already exists, track the new client
  // if it doesn't already exist, create a new game and track the client
  GameClients.set(gameId, [...(GameClients.get(gameId) ?? []), webSocket]);
  game.players.push({
    name: playerName,
    hand: [],
  });
  return game;
}

function getGameState(
  game: EgyptianRatScrew,
  name: string
): GameStartedPayload {
  const players = game.players.map((player: Player) => player.name);
  const scores = game.score;
  const pile = game.pile;
  const handSize = game.players.find((player: Player) => player.name === name)
    ?.hand.length;
  const slapRules = game.slapRules;
  const currentPlayer = game.players[game.currentPlayerIndex].name;
  const active = true;

  return {
    type: "game-started",
    players,
    scores,
    pile,
    handSize,
    slapRules,
    currentPlayer,
    active,
  };
}

export default router;
