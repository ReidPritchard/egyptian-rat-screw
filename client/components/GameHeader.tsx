import React from 'react';
import { Group, Badge, Title, Text } from '@mantine/core';
import { GameState } from '../types';

interface GameHeaderProps {
  gameState: GameState;
  isLocalPlayerTurn: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameState, isLocalPlayerTurn }) => {
  return (
    <Group justify="space-between" mb="md">
      <Title order={3}>{gameState.name}</Title>
      <Badge color={isLocalPlayerTurn ? 'green' : 'blue'} size="lg">
        {isLocalPlayerTurn ? 'Your Turn' : `${gameState.playerNames[gameState.currentPlayerId]}'s Turn`}
      </Badge>
      {gameState.cardChallenge && (
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
