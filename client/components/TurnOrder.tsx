import React, { useEffect, useState } from 'react';
import { Group, Text, Box, ThemeIcon, Flex } from '@mantine/core';
import { IconCircle, IconChevronRight } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '../types';

interface TurnOrderProps {
  gameState: GameState;
  localPlayerId: string;
}

export const TurnOrder: React.FC<TurnOrderProps> = ({ gameState, localPlayerId }) => {
  const currentPlayerIndex = gameState.currentPlayerId;
  const players = gameState.playerNames;

  return (
    <Box>
      <Flex direction="column" justify="flex-end" align="self-start">
        <AnimatePresence>
          {gameState.playerIds
            .sort((a, b) => gameState.playerHandSizes[a] - gameState.playerHandSizes[b])
            .map((playerId, index) => (
              <motion.div
                key={playerId}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                style={{ display: 'flex', alignItems: 'flex-end' }}
              >
                <ThemeIcon
                  color={playerId === localPlayerId ? 'green' : 'blue'}
                  variant={playerId === currentPlayerIndex ? 'filled' : 'outline'}
                >
                  <IconCircle size={16} />
                </ThemeIcon>
                <Group>
                  <Text style={{ margin: '0 5px' }} fw={playerId === localPlayerId ? 'bold' : 'normal'}>
                    {players[playerId]}
                  </Text>
                  <Text size="xs" c="gray">
                    {gameState.playerHandSizes[playerId]}
                  </Text>
                </Group>
              </motion.div>
            ))}
        </AnimatePresence>
      </Flex>
    </Box>
  );
};
