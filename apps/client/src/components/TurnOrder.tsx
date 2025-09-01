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
		<div className="w-full min-w-fit overflow-x-auto">
			<AnimatePresence>
				<ul className="steps min-w-fit">
					{players.map((player, _index) => (
						<motion.li
							key={player.id}
							className={`step flex-shrink-0 ${
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
							<div
								className={`text-xs sm:text-sm flex flex-col items-center gap-1 min-w-0 ${
									player.id === localPlayerId ? "font-bold" : ""
								}`}
							>
								<span className="truncate max-w-16 sm:max-w-24 md:max-w-32 lg:max-w-none">
									{player.name}
								</span>
								<span className="text-xs text-base-content/60">
									({player.cardCount})
								</span>
							</div>
						</motion.li>
					))}
				</ul>
			</AnimatePresence>
		</div>
	);
};
