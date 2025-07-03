import { isGameStatusInCategory } from "@/utils/categories";
import type React from "react";
import { useGameStore } from "../store/useGameStore";

export const GameHeader: React.FC = () => {
	const { gameState, isLocalPlayerTurn } = useGameStore();

	return (
		<div className="flex flex-row justify-between mb-4">
			{gameState?.status &&
				isGameStatusInCategory(gameState?.status, "IN_GAME") && (
					<div
						className={`badge ${
							isLocalPlayerTurn ? "badge-accent" : "badge-outline"
						}`}
					>
						{isLocalPlayerTurn
							? "Your Turn"
							: `${
									gameState?.players.find(
										(player) => player.id === gameState.currentPlayerId,
									)?.name
								}'s Turn`}
					</div>
				)}
		</div>
	);
};
