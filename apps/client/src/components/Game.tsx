import { GameStage } from "@oer/shared/types";
import type React from "react";
import { useEffect, useState } from "react";
import { newLogger } from "../logger";
import { useApplicationStore } from "../store/useApplicationStore";
import { useGameStore } from "../store/useGameStore";
import { GameBoard } from "./GameBoard";
import { GameHeader } from "./GameHeader";
import { PlayerActions } from "./PlayerActions";
import { PreGame } from "./PreGame";

const logger = newLogger("Game");

export const Game: React.FC = () => {
  const { isGameStarting, gameState } = useGameStore();
  const { localPlayer } = useApplicationStore();

  // UI for card challenges
  const [cardChallengeStyle, setCardChallengeStyle] = useState<string>("");

  useEffect(() => {
    if (gameState?.faceCardChallenge) {
      logger.info("Card challenge", {
        data: { cardChallenge: gameState.faceCardChallenge },
      });

      const isChallenger =
        gameState.faceCardChallenge.challenger.id === localPlayer?.id;
      setCardChallengeStyle(
        `border-2 border-${isChallenger ? "pink" : "green"} text-${
          isChallenger ? "white" : "black"
        }`
      );
    } else {
      setCardChallengeStyle("");
    }
  }, [gameState?.faceCardChallenge, localPlayer?.id]);

  // If game state is not yet loaded, show a loading indicator
  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-infinity loading-lg" />
        <p className="ml-2">Loading game...</p>
      </div>
    );
  }

  return (
    <div
      className={`h-full w-full p-4 rounded-lg flex-1 flex flex-col ${cardChallengeStyle}`}
    >
      <GameHeader />
      <div className="flex-grow">
        {gameState.stage === GameStage.PRE_GAME ? <PreGame /> : <GameBoard />}
      </div>
      <PlayerActions />
    </div>
  );
};
