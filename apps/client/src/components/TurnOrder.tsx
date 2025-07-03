import type { ClientGameState } from "@oer/shared/types";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";

interface TurnOrderProps {
	gameState: ClientGameState;
	localPlayerId: string;
}

export const TurnOrder: React.FC<TurnOrderProps> = ({
	gameState,
	localPlayerId,
}) => {
	const currentPlayerIndex = gameState.currentPlayerId;
	const players = gameState.players;

	return (
		<div
			id="turn-order"
			className="w-full"
		>
			<AnimatePresence>
				<ul className="steps">
					{gameState.players.map((player, _index) => (
						<motion.li
							key={player.id}
							className={`step ${
								player.id === currentPlayerIndex
									? "step-primary"
									: "step-neutral"
							}`}
							data-content={player.id === localPlayerId ? "★" : ""}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.5, ease: "easeInOut" }}
						>
							<p
								className={`text-sm flex flex-row items-baseline justify-between ${
									player.id === localPlayerId ? "font-bold" : ""
								}`}
							>
								{player.name}
								<p className="text-xs text-gray-500 p-1">
									({player.cardCount})
								</p>
							</p>
						</motion.li>
					))}
				</ul>
			</AnimatePresence>
		</div>
	);
};
