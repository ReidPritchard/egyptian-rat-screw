import type { Card } from "@oer/shared/types";
import { motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { PlayingCard } from "./PlayingCard";

interface BottomCardProps {
  bottomCard: Card | null;
  duration: number;
}

export const BottomCard: React.FC<BottomCardProps> = ({
  bottomCard,
  duration,
}) => {
  // Only show the bottom card for a short duration
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!bottomCard) return null;

  return (
    <motion.div
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2"
    >
      <p className="mb-2">Bottom card (invalid slap):</p>
      <PlayingCard
        suit={bottomCard.suit}
        value={bottomCard.rank}
        faceUp={true}
      />
    </motion.div>
  );
};
