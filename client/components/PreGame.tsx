import { Button, Container, Group, Paper, Text, Title } from '@mantine/core';
import React from 'react';
import { api } from '../api';
import { useApplicationContext } from '../hooks/ApplicationState';

export const PreGame: React.FC = () => {
  const { gameState } = useApplicationContext();

  const handleStartVote = () => {
    api.startVote('startGame');
  };

  const handleLeaveGame = () => {
    if (gameState?.name) {
      api.leaveGame({ gameName: gameState.name });
    }
  };

  const isVoteDisabled = (gameState?.playerIds.length ?? 0) < 2;

  return (
    <Container size="sm" p="lg">
      <Paper shadow="xs" p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>{gameState?.name}</Title>
          <Text size="lg">Players: {gameState?.playerIds.length}</Text>
        </Group>
        <Group justify="center" mt="xl">
          <Button color="green" onClick={handleStartVote} disabled={isVoteDisabled}>
            Start Vote to Begin Game
          </Button>
          <Button color="red" onClick={handleLeaveGame}>
            Leave Game
          </Button>
        </Group>
      </Paper>
    </Container>
  );
};
