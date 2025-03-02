import { newLogger } from "@/logger";
import type React from "react";
import { Suspense } from "react";
import useApplicationStore from "../store/useApplicationStore";
import { useGameStore } from "../store/useGameStore";
import { CardStack } from "./CardStack";
import { TurnOrder } from "./TurnOrder";

const logger = newLogger("GameBoard");

// Loading state component for consistent loading UI
const LoadingState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center h-full gap-4">
    <span className="loading loading-infinity loading-lg" />
    <p className="text-center text-sm mb-2">{message}</p>
  </div>
);

// Main game board component showing cards and turn order
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
        <div className="flex flex-col h-full max-w-screen-lg m-auto">
          <TurnOrder gameState={gameState} localPlayerId={localPlayer.id} />
          <div className="flex-1 flex flex-col justify-center p-4">
            <p className="text-center text-sm mb-2">
              Pile Size: {gameState.centralPileCount}
            </p>
            <CardStack pile={gameState.centralPile} />
          </div>
        </div>
      </div>
    </Suspense>
  );
};
