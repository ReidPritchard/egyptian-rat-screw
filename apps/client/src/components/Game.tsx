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
import { LoadingState } from "./common/LoadingState";

const logger = newLogger("Game");

export const Game: React.FC = () => {
	const { gameState } = useGameStore();
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
		return <LoadingState message="Loading game..." />;
	}

	const activeCardChallenge = gameState.faceCardChallenge;
	const isChallenger = activeCardChallenge?.initiator.id === localPlayer?.id;

	// AIDEV-NOTE: Enhanced border styling with better type safety and extensibility
	const CHALLENGE_BORDER_STYLES = {
		none: "border-base-300",
		challenger: "border-success",
		challenged: "border-warning",
	} as const;

	type ChallengeBorderType = keyof typeof CHALLENGE_BORDER_STYLES;

	const getChallengeBorderType = (): ChallengeBorderType => {
		if (!activeCardChallenge) return "none";
		return isChallenger ? "challenger" : "challenged";
	};

	const getBorderStyle = () => {
		const borderType = getChallengeBorderType();
		return CHALLENGE_BORDER_STYLES[borderType];
	};

	return (
		<div
			className={`h-full w-full p-4 rounded-xl flex-1 flex flex-col border-2 transition-colors duration-300 ${getBorderStyle()}`}
		>
			<div className="grow space-y-4 text-base-content/90">
				{/* Show pre-game or game board based on game status */}
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
