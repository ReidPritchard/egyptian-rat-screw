import type React from "react";
import { Suspense, useId } from "react";
import { newLogger } from "@/logger";
import useApplicationStore from "../store/useApplicationStore";
import { useGameStore } from "../store/useGameStore";
import { CardStack } from "./CardStack";
import { SlapResult } from "./SlapResult";
import { TurnOrder } from "./TurnOrder";
import { CardChallengeNotification } from "./notifications/CardChallenge";
import { GameEventLog } from "./GameEventLog";
import { LoadingState } from "./common/LoadingState";
import { GameHeader } from "./GameHeader";

// const _logger = newLogger("GameBoard");

// Main game board component showing cards and turn order
export const GameBoard: React.FC = () => {
	const { localPlayer } = useApplicationStore();
	const { gameState } = useGameStore();

	const gameBoardId = useId();
	const pileSizeId = useId();

	// AIDEV-NOTE: Enhanced loading states with better messaging
	if (!gameState) {
		return <LoadingState message="Initializing game..." />;
	}

	if (!localPlayer) {
		return <LoadingState message="Joining game..." />;
	}

	const activeCardChallenge = gameState.faceCardChallenge;
	const isChallenger = activeCardChallenge?.initiator.id === localPlayer?.id;

	return (
		<Suspense fallback={<LoadingState message="Loading game..." />}>
			<div
				id={gameBoardId}
				className="h-full w-full relative"
			>
				{/* AIDEV-NOTE: Overflow-safe grid with proper constraints and scrolling */}
				<div className="grid grid-rows-[minmax(auto,_max-content)_1fr] h-full max-w-6xl mx-auto p-4 gap-4 min-h-0">
					{/* Turn order with overflow handling */}
					<div className="overflow-x-auto overflow-y-hidden min-h-0">
						{/* Display card challenge data 
              TODO: Move either into GameHeader or create a dedicated component
            */}
						{activeCardChallenge && (
							<div
								className={`mb-6 p-4 rounded-lg text-center transition-all duration-300 animate-fade-in-up shadow-lg ${
									isChallenger
										? "bg-success/10 text-base border border-success/20"
										: "bg-warning/10 text-base border border-warning/20"
								}`}
							>
								{isChallenger ? (
									<p className="font-medium">
										✨ You initiated a challenge with a{" "}
										<span className="font-bold text-success">
											{activeCardChallenge.faceCardRank}
										</span>
										.
										<br />
										Opponent has{" "}
										<span className="badge badge-success badge-sm">
											{activeCardChallenge.cardsToPlay - 
                        activeCardChallenge.cardsPlayed}
										</span>{" "}
										attempt(s) to respond.
									</p>
								) : (
									<p className="font-medium">
										⚡{" "}
										<span className="font-bold text-warning">
											{activeCardChallenge.initiator.name}
										</span>{" "}
										challenged you with a{" "}
										<span className="font-bold text-warning">
											{activeCardChallenge.faceCardRank}
										</span>
										!
										<br />
										You have{" "}
										<span className="badge badge-warning badge-sm">
											{activeCardChallenge.cardsToPlay - 
                        activeCardChallenge.cardsPlayed}
										</span>{" "}
										attempt(s) to respond.
									</p>
								)}
							</div>
						)}

						<div className="flex items-center justify-center mb-2 gap-4 min-w-max">
							<GameHeader />
							<div>
								<TurnOrder
									gameState={gameState}
									localPlayerId={localPlayer.id}
								/>
							</div>
						</div>
					</div>

					{/* Main game area with constrained height */}
					<div className="flex flex-col justify-center items-center gap-4 min-h-0 overflow-hidden">
						<div className="text-center">
							<p
								id={pileSizeId}
								className="text-base font-medium text-base-content/70 mb-3"
							>
								Pile Size:{" "}
								<span className="badge badge-primary badge-sm">
									{gameState.centralPileCount}
								</span>
							</p>
						</div>

						{/* Card stack with size constraints to prevent overflow */}
						<div className="relative flex items-center justify-center min-h-0">
							<div className="rounded-2xl p-4 sm:p-6 backdrop-blur-sm border border-base-300/20 transition-all duration-300 hover:shadow-lg max-w-full max-h-full">
								<div className="w-full h-full flex items-center justify-center">
									<CardStack pile={gameState.centralPile} />
								</div>
							</div>
							<SlapResult />
							<CardChallengeNotification />
						</div>
					</div>
				</div>

				{/* Event log with better responsive constraints */}
				<div className="absolute bottom-4 left-2 right-2 w-auto sm:left-4 sm:right-auto sm:w-64 md:w-80 lg:w-96 z-10 max-h-[40vh]">
					<div className="overflow-hidden">
						<GameEventLog />
					</div>
				</div>
			</div>
		</Suspense>
	);
};
