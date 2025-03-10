import type { Card } from "@oer/shared/types";
import { forwardRef } from "react";
import { PlayingCard } from "./PlayingCard";

interface CardStackProps {
  pile: Card[] | null;
}

export const CardStack = forwardRef<HTMLDivElement, CardStackProps>(
  ({ pile }, ref) => {
    if (!pile) return null;

    return (
      <div className="stack max-w-screen m-auto max-h-screen">
        {pile.map((card, _index) => (
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
