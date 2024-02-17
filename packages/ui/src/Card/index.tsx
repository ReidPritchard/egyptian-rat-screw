import React from "react";
import { useState } from "react";
import "./styles.css";

export interface CardProps {
  card: {
    suit: string;
    value: string;
  };

  /**
   * The angle of the card in degrees
   * This is used to create a more realistic stack of cards
   */
  tilt?: number;
}

export default function Card({ card, tilt }: CardProps): JSX.Element {
  const [flipped, setFlipped] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(tilt || 0);

  return (
    <div
      className={`card ${flipped ? "flipped" : ""}`}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="front">
        <p className="suit">{card.suit}</p>
        <p className="rank">{card.value}</p>
      </div>
      <div className="back"></div>
    </div>
  );
}
