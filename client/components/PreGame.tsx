import React from 'react';
import { Container, Group, Text, Button, Paper, Title } from '@mantine/core';
import { GameState, PlayerInfo } from '../types';
import { api } from '../api';

interface PreGameProps {
  gameState: GameState;
  localPlayerId: string;
}

export const PreGame: React.FC<PreGameProps> = ({ gameState, localPlayerId }) => {
  const handleStartVote = () => {
    api.startVote('startGame');
  };

  const isVoteDisabled = gameState.playerIds.length < 2;

  return (
    <Container size="sm" p="lg">
      <Paper shadow="xs" p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>{gameState.name}</Title>
          <Text size="lg">Players: {gameState.playerIds.length}</Text>
        </Group>
        <Group justify="center" mt="xl">
          <Button color="green" onClick={handleStartVote} disabled={isVoteDisabled}>
            Start Vote to Begin Game
          </Button>
        </Group>
      </Paper>
    </Container>
  );
};
