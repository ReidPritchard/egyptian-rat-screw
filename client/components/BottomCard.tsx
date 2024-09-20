import React from 'react';
import { Box, Text, Transition } from '@mantine/core';
import { PlayingCard } from '../PlayingCard';
import { Card } from '../types';

interface BottomCardProps {
  bottomCard: Card | null;
}

export const BottomCard: React.FC<BottomCardProps> = ({ bottomCard }) => {
  if (!bottomCard) return null;

  return (
    <Transition mounted={!!bottomCard} transition="fade" duration={300} timingFunction="ease">
      {(styles) => (
        <Box style={{ ...styles, position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
          <Text mb="xs">Bottom card (invalid slap):</Text>
          <PlayingCard suit={bottomCard.suit} value={bottomCard.rank} faceUp={true} />
        </Box>
      )}
    </Transition>
  );
};
