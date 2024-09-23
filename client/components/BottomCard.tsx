import React, { useState, useEffect } from 'react';
import { Box, Text, Transition } from '@mantine/core';
import { PlayingCard } from './PlayingCard';
import { Card } from '../types';

interface BottomCardProps {
  bottomCard: Card | null;
  duration: number;
}

export const BottomCard: React.FC<BottomCardProps> = ({ bottomCard, duration }) => {
  if (!bottomCard) return null;

  // Only show the bottom card for a short duration
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <Transition mounted={isVisible} transition="fade" duration={50} timingFunction="ease">
      {(styles) => (
        <Box style={{ ...styles, position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
          <Text mb="xs">Bottom card (invalid slap):</Text>
          <PlayingCard suit={bottomCard.suit} value={bottomCard.rank} faceUp={true} />
        </Box>
      )}
    </Transition>
  );
};
