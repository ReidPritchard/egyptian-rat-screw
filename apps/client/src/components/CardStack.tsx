import type { Card } from "@oer/shared/types";
import { forwardRef } from "react";
import { PlayingCard } from "./PlayingCard";

interface CardStackProps {
	pile: Card[] | null;
}

export const CardStack = forwardRef<HTMLDivElement, CardStackProps>(
	({ pile }, ref) => {
		if (!pile) return null;

		// AIDEV-NOTE: Semi-realistic card stack showing up to 5 cards with offset positioning and depth
		const displayCards = pile; // Show up to 5 top cards
		const hasCards = displayCards.length > 0;

		if (!hasCards) {
			return (
				<div className="relative w-24 h-36 sm:w-36 sm:h-54 md:w-48 md:h-72 lg:w-72 lg:h-108 flex items-center justify-center border-2 border-dashed border-base-300 rounded-lg bg-base-200/50">
					<span className="text-base-content/50 text-sm font-medium">
						Empty
					</span>
				</div>
			);
		}

		return (
			<div
				ref={ref}
				className="relative w-24 h-36 sm:w-36 sm:h-54 md:w-48 md:h-72 lg:w-72 lg:h-108"
			>
				{displayCards.map((card, index) => {
					const isTopCard = index === displayCards.length - 1;
					const offsetX = index * 1.5; // Horizontal offset
					const offsetY = index * -1; // Vertical offset (negative for upward stacking)
					const rotation = (index - 2) * 1.5; // Slight rotation for realism
					const zIndex = index + 1;

					return (
						<div
							key={`${card.id}-${index}`}
							className="absolute transition-all duration-300 ease-in-out"
							style={{
								transform: `translateX(${offsetX}px) translateY(${offsetY}px) rotate(${rotation}deg)`,
								zIndex: zIndex,
								filter: isTopCard ? "none" : "brightness(0.9)",
							}}
						>
							<PlayingCard
								suit={card.suit}
								value={card.rank}
								faceUp={isTopCard} // Only show the top card face up
							/>
						</div>
					);
				})}
			</div>
		);
	},
);

CardStack.displayName = "CardStack";
