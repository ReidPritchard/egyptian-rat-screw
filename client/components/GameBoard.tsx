import React from 'react';
import { Grid, Box, Group, Text } from '@mantine/core';
import { BottomCard } from './BottomCard';
import { CardStack } from './CardStack';
import { TurnOrder } from './TurnOrder';
import { config } from '../config';
import { GameState, Card } from '../types';

interface GameBoardProps {
  gameState: GameState;
  bottomCard: Card | null;
  bottomCardTrigger: number;
  localPlayerId: string;
}

export const GameBoard: React.FC<GameBoardProps> = ({ gameState, bottomCard, bottomCardTrigger, localPlayerId }) => {
  return (
    <Grid justify="center" align="flex-start">
      <Grid.Col span={8}>
        <Box my="md">
          <Text ta="center" size="sm" mb="xs">
            Pile Size: {gameState.pile?.length ?? 0}
          </Text>
          <Group justify="center" mb="xl">
            <BottomCard
              bottomCard={bottomCard}
              duration={config.game.bottomCardDisplayDuration}
              key={bottomCardTrigger}
            />
            <CardStack pile={gameState.pile} />
          </Group>
        </Box>
      </Grid.Col>
      <Grid.Col span={4}>
        <TurnOrder gameState={gameState} localPlayerId={localPlayerId} />
      </Grid.Col>
    </Grid>
  );
};
