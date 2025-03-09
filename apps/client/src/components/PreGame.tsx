import { useApi } from "@/contexts/ApiContext";
import { newLogger } from "@/logger";
import { useCallback } from "react";
import { useApplicationStore } from "../store/useApplicationStore";
import { useGameStore } from "../store/useGameStore";
import { Sprite } from "./Sprite";

const logger = newLogger("PreGame");

/**
 * Pre-game lobby component that shows game information and player readiness
 */
export const PreGame = () => {
  const { gameState } = useGameStore();
  const { localPlayer } = useApplicationStore();
  const api = useApi();

  // Handle player ready status
  const handleReadyClick = useCallback(() => {
    if (!(api && localPlayer)) {
      logger.error(
        "Cannot ready player: API not initialized or player not found"
      );
      return;
    }
    api.playerReady(localPlayer);
  }, [api, localPlayer]);

  // Handle leave game
  const handleLeaveGame = useCallback(() => {
    if (!api) {
      logger.error("Cannot leave game: API not initialized");
      return;
    }
    api.leaveGame();
  }, [api]);

  // Handle game start vote
  const handleStartVote = useCallback(() => {
    if (!api) {
      logger.error("Cannot start vote: API not initialized");
      return;
    }
    api.startVote("startGame");
  }, [api]);

  // Get player statuses
  const isLocalPlayerReady =
    localPlayer &&
    gameState?.players.find((player) => player.id === localPlayer.id)
      ?.status === "ready";

  const allPlayersReady = gameState?.players.every(
    (player) => player.status === "ready"
  );

  const playerCount = gameState?.players.length || 0;
  const canStartGame = playerCount >= 2 && allPlayersReady;
  const notReadyPlayers =
    gameState?.players.filter((player) => player.status !== "ready") || [];

  // Loading state
  if (!(gameState && localPlayer)) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="loading loading-dots loading-lg" />
          <p className="text-sm">Loading game information...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      id="pre-game-lobby"
      className="flex flex-col h-full w-full max-w-md mx-auto p-4 gap-6"
    >
      {/* Game Info Card */}
      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body p-4">
          <div className="flex justify-between items-center">
            <h3 id="game-id" className="card-title text-lg">
              Game: {gameState.gameId}
            </h3>
            <div id="player-count" className="badge badge-lg">
              {playerCount}/{gameState.settings.maximumPlayers}
            </div>
          </div>

          <div className="divider my-2" />

          {/* Players List */}
          <div>
            <h4 id="player-list-title" className="font-medium mb-2">
              Players
            </h4>
            <ul id="player-list" className="space-y-1">
              {gameState.players.map((player) => (
                <li key={player.id} className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      player.status === "ready" ? "bg-success" : "bg-base-300"
                    }`}
                  />
                  <span>
                    {player.name}
                    {player.id === localPlayer.id && (
                      <span className="text-sm opacity-70"> (You)</span>
                    )}
                  </span>
                  {player.status === "ready" && (
                    <span className="text-xs text-success ml-auto">Ready</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <button
            className="btn btn-sm btn-outline btn-error mt-4 self-end"
            onClick={handleLeaveGame}
            type="button"
          >
            Leave Game
          </button>
        </div>
      </div>

      {/* Ready Status Card */}
      <div className="card bg-base-100 shadow-md border border-base-300">
        <div className="card-body flex flex-col items-center p-4">
          <Sprite
            spriteSrc="/assets/sprites/ers-assets-v01"
            alt="Game status"
            frameKey={
              isLocalPlayerReady
                ? "ers-assets-v01 0.aseprite"
                : "ers-assets-v01 1.aseprite"
            }
            width={96}
            height={96}
          />

          {!isLocalPlayerReady ? (
            <>
              <p className="text-lg font-medium mt-2">Ready to Play?</p>
              <button
                id="ready-button"
                className="btn btn-success btn-block mt-4"
                onClick={handleReadyClick}
                type="button"
                disabled={playerCount < 2}
                title={
                  playerCount < 2 ? "Need at least 2 players to start" : ""
                }
              >
                Mark as Ready
              </button>

              {playerCount < 2 && (
                <p className="text-sm text-center mt-2 opacity-70">
                  Waiting for more players to join...
                </p>
              )}
            </>
          ) : canStartGame ? (
            <>
              <p className="text-lg font-medium mt-2 text-center">
                All Players Ready!
              </p>
              <button
                className="btn btn-primary btn-block mt-4"
                onClick={handleStartVote}
                type="button"
              >
                Start Game
              </button>
            </>
          ) : (
            <>
              <p className="text-lg font-medium mt-2">You are Ready!</p>
              <div className="flex items-center gap-2 mt-3">
                <div className="loading loading-spinner loading-sm" />
                <p className="text-sm">Waiting for others...</p>
              </div>

              {notReadyPlayers.length > 0 && (
                <div className="w-full mt-3 p-2 bg-base-200 rounded-lg">
                  <p className="text-sm font-medium">Still waiting on:</p>
                  <ul className="text-sm mt-1">
                    {notReadyPlayers.map((player) => (
                      <li key={player.id}>{player.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
