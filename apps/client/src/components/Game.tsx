import type React from "react";
import { useEffect, useState } from "react";
import { newLogger } from "../logger";
import { useApplicationStore } from "../store/useApplicationStore";
import { useGameStore } from "../store/useGameStore";
import { GameBoard } from "./GameBoard";
import { GameHeader } from "./GameHeader";
import { PlayerActions } from "./PlayerActions";

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

  return (
    <div
      className={`h-full w-full p-4 rounded-lg flex-1 flex flex-col ${cardChallengeStyle}`}
    >
      <GameHeader />
      <div className="flex-grow">
        <GameBoard />
      </div>
      <PlayerActions />
    </div>
  );
};
