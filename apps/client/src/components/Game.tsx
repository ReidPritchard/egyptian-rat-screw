import type React from "react";
import { useEffect } from "react";
import { isGameStatusInCategory } from "@/utils/categories";
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

	useEffect(() => {
		if (gameState?.faceCardChallenge) {
			logger.info("Card challenge", {
				data: { cardChallenge: gameState.faceCardChallenge },
			});
		}
	}, [gameState?.faceCardChallenge]);

	// If game state is not yet loaded, show a loading indicator
	if (!gameState) {
		return (
			<div className="flex items-center justify-center h-full">
				<span className="loading loading-infinity loading-lg" />
				<p className="ml-2">Loading game...</p>
			</div>
		);
	}

	const activeCardChallenge = gameState.faceCardChallenge;
	const isChallenger = activeCardChallenge?.initiator.id === localPlayer?.id;

	return (
		<div
			className={`
        h-full w-full p-4 rounded-lg flex-1 flex flex-col
        border-2 border-${
					activeCardChallenge ? (isChallenger ? "success" : "warning") : "gray"
				}
      `}
		>
			<GameHeader />
			<div className="grow">
				{isGameStatusInCategory(gameState.status, "PRE_GAME") ? (
					<PreGame />
				) : (
					<GameBoard />
				)}
			</div>
			<PlayerActions />
		</div>
	);
};
