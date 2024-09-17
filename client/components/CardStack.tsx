import React from 'react';
import { Box } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayingCard } from '../PlayingCard';
import { Card } from '../types';

interface CardStackProps {
  pile: Card[] | null;
}

export const CardStack: React.FC<CardStackProps> = ({ pile }) => {
  if (!pile) return null;

  return (
    <Box style={{ position: 'relative', width: '60px', height: '90px' }}>
      <AnimatePresence>
        {pile.map((card, index, array) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: -50 }}
            animate={{
              opacity: 1,
              y: 0,
              rotate: (index * 10) % 360,
              zIndex: array.length - index,
            }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              width: '60px',
              height: '90px',
            }}
          >
            <PlayingCard suit={card.suit} value={card.rank} faceUp={true} />
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};