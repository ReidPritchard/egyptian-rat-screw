import { forwardRef } from "react";
import { useLocalPlayerSettings } from "../hooks/useLocalPlayerSettings";

interface CardProps {
	suit: string;
	value: string;
	faceUp: boolean;
}

const suitSymbols: { [key: string]: string } = {
	hearts: "♥",
	diamonds: "♦",
	clubs: "♣",
	spades: "♠",
};

export const PlayingCard = forwardRef<HTMLDivElement, CardProps>(
	({ suit, value, faceUp }, ref) => {
		const { highContrast } = useLocalPlayerSettings(
			(state) => state.settings.ui,
		);

		const suitSymbol = suitSymbols[suit.toLowerCase()];

		// For high-contrast mode, use different colors for each suit
		const suitColors: { [key: string]: string } = {
			hearts: highContrast ? "text-red-500" : "text-red-500",
			diamonds: highContrast ? "text-yellow-500" : "text-red-500",
			clubs: highContrast ? "text-blue-500" : "text-black",
			spades: highContrast ? "text-black" : "text-black",
		};
		const color = suitColors[suit.toLowerCase()];

		return (
			<div
				ref={ref}
				className={`${faceUp ? "bg-white" : "bg-gray-300"} ${color} ${
					faceUp ? "border-2 border-black" : "border-2 border-gray-300"
				} 
        rounded-lg 
        p-2 
        flex flex-col 
        justify-between 
        aspect-playing-card 
        min-w-24
        min-h-36
        sm:min-w-36
        sm:min-h-54
        md:min-w-48
        md:min-h-72
        lg:min-w-72
        lg:min-h-108`}
			>
				{faceUp ? (
					<>
						<p className="text-sm font-bold text-left">{value}</p>
						<p className="text-xl text-center">{suitSymbol}</p>
						<p
							className="text-sm font-bold text-left"
							style={{ transform: "rotate(180deg)" }}
						>
							{value}
						</p>
					</>
				) : (
					<p className="text-xl text-center text-gray-300">?</p>
				)}
			</div>
		);
	},
);
