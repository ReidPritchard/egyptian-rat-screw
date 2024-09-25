import { Badge, Group, Text, Title } from '@mantine/core';
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

      {/* TODO: Use a different UI for the card challenge */}
      {/* something like the whole board is simplified to just show the challenge */}
      {/* and the background color gets closer to red as the remaining counter chances get lower */}
      {gameState?.cardChallenge && (
        <Badge color={gameState.cardChallenge.result === 'challenger' ? 'red' : 'green'} size="lg">
          {gameState.cardChallenge.active ? (
            <Group>
              <Text>
                {gameState.cardChallenge.challenger.name} challenged {gameState.cardChallenge.challenged.name}
              </Text>
              <Text>{gameState.cardChallenge.remainingCounterChances} remaining counter chances</Text>
            </Group>
          ) : (
            <Text>Challenge Result: {gameState.cardChallenge.result} won</Text>
          )}
        </Badge>
      )}
    </Group>
  );
};
