import React, { useEffect, useState } from 'react';
import { Group, Text, Box, ThemeIcon, Flex } from '@mantine/core';
import { IconCircle, IconChevronRight } from '@tabler/icons-react';
import { GameState } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TurnOrderProps {
  gameState: GameState;
  localPlayerId: string;
}

export const TurnOrder: React.FC<TurnOrderProps> = ({ gameState, localPlayerId }) => {
  const currentPlayerIndex = gameState.currentPlayer;
  const players = gameState.players;

  //   const [orderedPlayers, setOrderedPlayers] = useState(() => {
  //     const initialOrder = [];
  //     for (let i = 0; i < players.length; i++) {
  //       initialOrder.push(players[(currentPlayerIndex + i) % players.length]);
  //     }
  //     return initialOrder;
  //   });

  return (
    <Box>
      <Flex direction="column" justify="flex-end" align="self-start">
        <AnimatePresence>
          {players.map((player, index) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              style={{ display: 'flex', alignItems: 'flex-end' }}
            >
              <ThemeIcon color={player.id === players[currentPlayerIndex].id ? 'green' : 'blue'} variant="light">
                <IconCircle size={16} />
              </ThemeIcon>
              <Text style={{ margin: '0 5px' }} fw={player.id === players[currentPlayerIndex].id ? 'bold' : 'normal'}>
                {player.name}
              </Text>
            </motion.div>
          ))}
        </AnimatePresence>
      </Flex>
    </Box>
  );
};
