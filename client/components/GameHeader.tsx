import { Badge, Group, Title } from '@mantine/core';
import React from 'react';
import { useApplicationContext } from '../hooks/ApplicationState';

export const GameHeader: React.FC = () => {
  const { gameState, isLocalPlayerTurn } = useApplicationContext();

  return (
    <Group justify="space-between" mb="md">
      <Title order={3}>{gameState?.name}</Title>
      <Badge color={isLocalPlayerTurn ? 'green' : 'blue'} size="lg">
        {isLocalPlayerTurn ? 'Your Turn' : `${gameState?.playerNames[gameState.currentPlayerId]}'s Turn`}
      </Badge>
    </Group>
  );
};
