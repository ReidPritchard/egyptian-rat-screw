import type React from "react";
import { config } from "../config";
import useApplicationStore, {
  ApplicationStore,
} from "../store/useApplicationStore";
import { GameStage } from "../types";
import { BottomCard } from "./BottomCard";
import { CardStack } from "./CardStack";
import { TurnOrder } from "./TurnOrder";
import { useGameStore } from "../store/useGameStore";

export const GameBoard: React.FC = () => {
  const { localPlayer } = useApplicationStore();
  const { gameState } = useGameStore();

  if (!gameState || !localPlayer) {
    if (!gameState) {
      console.error("GameBoard: gameState is null");
      return (
        <div className="flex flex-col items-center h-full gap-4">
          <p className="text-center text-sm mb-2">
            Waiting for game to start...
          </p>
        </div>
      );
    }

    if (!localPlayer) {
      console.error("GameBoard: localPlayer is null");
      return (
        <div className="flex flex-col items-center h-full gap-4">
          <p className="text-center text-sm mb-2">
            Waiting for player to join...
          </p>
        </div>
      );
    }

    return null;
  }

  const renderPreGameReady = () => {
    return (
      <div className="flex flex-col items-center h-full gap-4">
        {gameState.playerReadyStatus[localPlayer.id] ? "Ready" : "Not Ready"}

        {gameState.playerReadyStatus[localPlayer.id] === true && (
          <>
            <span className="loading loading-dots loading-lg" />
            <p className="text-center text-sm mb-2">
              Waiting for all players to be ready...
            </p>
          </>
        )}

        {gameState.playerReadyStatus[localPlayer.id] === true && (
          <div className="flex flex-col items-start">
            {gameState.playerIds
              .filter((playerId: string) => playerId !== localPlayer.id)
              .map((playerId: string) => (
                <div
                  key={playerId}
                  className={`badge badge-${
                    gameState.playerReadyStatus[playerId] ? "success" : "error"
                  }`}
                >
                  {gameState.playerNames[playerId]}:{" "}
                  {gameState.playerReadyStatus[playerId]
                    ? "Ready"
                    : "Not Ready"}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  const renderGameBoard = () => {
    return (
      <div className="flex flex-col h-full max-w-screen-lg m-auto">
        <TurnOrder gameState={gameState} localPlayerId={localPlayer.id} />
        <div className="flex-1 flex flex-col justify-center p-4">
          <p className="text-center text-sm mb-2">
            Pile Size: {gameState?.pileCards?.length ?? 0}
          </p>
          <CardStack pile={gameState.pileCards} />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full">
      {gameState.stage === GameStage.PRE_GAME
        ? renderPreGameReady()
        : renderGameBoard()}
    </div>
  );
};
