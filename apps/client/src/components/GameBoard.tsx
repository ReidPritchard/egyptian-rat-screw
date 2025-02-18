import type React from "react";
import { Suspense } from "react";
import useApplicationStore from "../store/useApplicationStore";
import { useGameStore } from "../store/useGameStore";
import { GameStage } from "../types";
import type { ClientGameState } from "../types";
import { BottomCard } from "./BottomCard";
import { CardStack } from "./CardStack";
import { TurnOrder } from "./TurnOrder";
import { newLogger } from "@/logger";

const logger = newLogger("GameBoard");

// Loading state component for consistent loading UI
const LoadingState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center h-full gap-4">
    <span className="loading loading-infinity loading-lg" />
    <p className="text-center text-sm mb-2">{message}</p>
  </div>
);

// Component to display player ready status
const PlayerReadyStatus: React.FC<{
  playerId: string;
  playerName: string;
  isReady: boolean;
}> = ({ playerId, playerName, isReady }) => (
  <div
    key={playerId}
    className={`badge badge-${isReady ? "success" : "error"}`}
  >
    {playerName}: {isReady ? "Ready" : "Not Ready"}
  </div>
);

interface GameComponentProps {
  gameState: ClientGameState;
  localPlayerId: string;
}

// Pre-game component showing ready status
const PreGameReady: React.FC<GameComponentProps> = ({
  gameState,
  localPlayerId,
}) => {
  logger.info("PreGameReady", {
    data: JSON.stringify(gameState, null, 2),
  });

  const isLocalPlayerReady = gameState.playerReadyStatus[localPlayerId];

  return (
    <div className="flex flex-col items-center h-full gap-4">
      {isLocalPlayerReady ? "Ready" : "Not Ready"}

      {isLocalPlayerReady && (
        <>
          <LoadingState message="Waiting for all players to be ready..." />
          <div className="flex flex-col items-start">
            {gameState.playerIds
              .filter((id: string) => id !== localPlayerId)
              .map((playerId: string) => (
                <PlayerReadyStatus
                  key={playerId}
                  playerId={playerId}
                  playerName={gameState.playerNames[playerId]}
                  isReady={gameState.playerReadyStatus[playerId]}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
};

// Main game board component showing cards and turn order
const MainGameBoard: React.FC<GameComponentProps> = ({
  gameState,
  localPlayerId,
}) => (
  <div className="flex flex-col h-full max-w-screen-lg m-auto">
    <TurnOrder gameState={gameState} localPlayerId={localPlayerId} />
    <div className="flex-1 flex flex-col justify-center p-4">
      <p className="text-center text-sm mb-2">
        Pile Size: {gameState.pileCards?.length ?? 0}
      </p>
      <CardStack pile={gameState.pileCards} />
    </div>
  </div>
);

export const GameBoard: React.FC = () => {
  const { localPlayer } = useApplicationStore();
  const { gameState } = useGameStore();

  // Early return for loading states
  if (!gameState) {
    return <LoadingState message="Waiting for game initialization..." />;
  }

  if (!localPlayer) {
    return <LoadingState message="Waiting for player to join..." />;
  }

  return (
    <Suspense fallback={<LoadingState message="Loading game..." />}>
      <div className="h-full w-full">
        {gameState.stage === GameStage.PRE_GAME ? (
          <PreGameReady gameState={gameState} localPlayerId={localPlayer.id} />
        ) : (
          <MainGameBoard gameState={gameState} localPlayerId={localPlayer.id} />
        )}
      </div>
    </Suspense>
  );
};
