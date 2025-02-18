import type React from "react";
import { forwardRef } from "react";
import type { Card } from "../types";
import { PlayingCard } from "./PlayingCard";

interface CardStackProps {
  pile: Card[] | null;
}

export const CardStack = forwardRef<HTMLDivElement, CardStackProps>(
  ({ pile }, ref) => {
    if (!pile) return null;

    return (
      <div className="flex-1 stack max-w-screen m-auto max-h-screen">
        {pile.map((card, index) => (
          <div
            key={card.id}
            className="place-content-center aspect-playing-card"
          >
            <PlayingCard
              ref={ref}
              suit={card.suit}
              value={card.rank}
              faceUp={true}
            />
          </div>
        ))}
      </div>
    );
  }
);

CardStack.displayName = "CardStack";
