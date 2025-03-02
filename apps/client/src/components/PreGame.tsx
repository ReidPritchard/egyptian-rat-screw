import { useApi } from "@/contexts/ApiContext";
import { newLogger } from "@/logger";
import type { ClientGameState } from "@oer/shared/types";
import type React from "react";
import { useCallback } from "react";
import { useApplicationStore } from "../store/useApplicationStore";
import { useGameStore } from "../store/useGameStore";
import { Sprite } from "./Sprite";

const logger = newLogger("PreGame");

/**
 * Loading state component for consistent loading UI
 */
const LoadingState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center gap-4">
    <div className="loading loading-dots loading-lg" />
    <p className="text-sm text-center">{message}</p>
  </div>
);

/**
 * Component to display player ready status
 */
const PlayerReadyStatus: React.FC<{
  player: { id: string; name: string; isReady?: boolean };
}> = ({ player }) => (
  <div
    className={`badge ${
      player.isReady ? "badge-success" : "badge-error"
    } badge-md my-1.5`}
  >
    {player.name}: {player.isReady ? "Ready" : "Not Ready"}
  </div>
);

/**
 * Displays the ready status for all players and handles local player readiness
 */
const PreGameReady: React.FC<{
  gameState: ClientGameState;
  localPlayerId: string;
}> = ({ gameState, localPlayerId }) => {
  logger.debug("Rendering PreGameReady");
  const api = useApi();

  const localPlayer = gameState.players.find(
    (player) => player.id === localPlayerId
  );

  const isLocalPlayerReady = localPlayer?.isReady;

  const handleReadyClick = useCallback(() => {
    if (!api) {
      logger.error("Cannot ready player: API not initialized");
      return;
    }

    if (localPlayer) {
      api.playerReady(localPlayer);
    }
  }, [api, localPlayer]);

  const otherPlayers = gameState.players.filter(
    (player) => player.id !== localPlayerId
  );

  return (
    <div className="card bg-base-100 shadow-md border border-base-300 w-full max-w-md">
      <div className="card-body flex flex-col items-center gap-4">
        <Sprite
          spriteSrc="/assets/sprites/ers-assets-v01"
          alt="Game asset"
          frameKey={
            isLocalPlayerReady
              ? "ers-assets-v01 0.aseprite"
              : "ers-assets-v01 1.aseprite"
          }
          width={128}
          height={128}
        />

        <p className="text-lg font-medium">
          {isLocalPlayerReady ? "You are Ready!" : "You are Not Ready"}
        </p>

        {!isLocalPlayerReady && (
          <button
            className="btn btn-success btn-block"
            onClick={handleReadyClick}
            type="button"
          >
            Mark as Ready
          </button>
        )}

        {isLocalPlayerReady && (
          <>
            <LoadingState message="Waiting for all players to be ready..." />
            <div className="flex flex-col items-start w-full mt-4">
              <p className="font-medium mb-2">Other Players:</p>
              {otherPlayers.length === 0 ? (
                <p className="text-sm opacity-60">
                  No other players have joined yet
                </p>
              ) : (
                otherPlayers.map((player) => (
                  <PlayerReadyStatus key={player.id} player={player} />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Pre-game lobby component that shows game information and allows players to ready up
 * or vote to start the game once everyone is ready.
 */
export const PreGame: React.FC = () => {
  const { gameState } = useGameStore();
  const { localPlayer } = useApplicationStore();
  const api = useApi();

  const handleStartVote = useCallback(() => {
    if (!api) {
      logger.error("Cannot start vote: API not initialized");
      return;
    }
    api.startVote("startGame");
  }, [api]);

  const handleLeaveGame = useCallback(() => {
    if (!api) {
      logger.error("Cannot leave game: API not initialized");
      return;
    }
    api.leaveGame();
  }, [api]);

  // Check if all players are ready
  const allPlayersReady = gameState?.players.every((player) => player.isReady);
  const playerCount = gameState?.players.length || 0;

  // Require at least 2 players and all players must be ready
  const isVoteDisabled = playerCount < 2 || !allPlayersReady;
  const voteTooltip =
    playerCount < 2
      ? "Need at least 2 players to start"
      : !allPlayersReady
      ? "All players must be ready"
      : "";

  // Early return for loading states
  if (!(gameState && localPlayer)) {
    return (
      <div className="container mx-auto flex justify-center items-center h-full max-w-lg">
        <LoadingState message="Loading game information..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="container mx-auto p-4 max-w-lg">
        <div className="card bg-base-100 shadow-md border border-base-300">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-title">Game Room: {gameState.gameId}</h3>
              <div className="badge badge-lg">Players: {playerCount}</div>
            </div>

            <div className="flex justify-center gap-2 mt-6">
              <button
                className="btn btn-success"
                onClick={handleStartVote}
                disabled={isVoteDisabled}
                title={voteTooltip}
                type="button"
              >
                {isVoteDisabled
                  ? "Waiting for Players..."
                  : "Start Vote to Begin Game"}
              </button>
              <button
                className="btn btn-error"
                onClick={handleLeaveGame}
                type="button"
              >
                Leave Game
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow flex justify-center items-center p-4">
        <PreGameReady gameState={gameState} localPlayerId={localPlayer.id} />
      </div>
    </div>
  );
};
