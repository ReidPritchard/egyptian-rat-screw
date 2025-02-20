import { useApi } from "@/contexts/ApiContext";
import { Button, Container, Group, Paper, Text, Title } from "@mantine/core";
import type React from "react";
import { useGameStore } from "../store/useGameStore";

export const PreGame: React.FC = () => {
  const { gameState } = useGameStore();
  const api = useApi();

  const handleStartVote = () => {
    api?.startVote("startGame");
  };

  const handleLeaveGame = () => {
    api?.leaveGame();
  };

  const isVoteDisabled = (gameState?.players.length ?? 0) < 2;

  return (
    <Container size="sm" p="lg">
      <Paper shadow="xs" p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={3}>{gameState?.gameId}</Title>
          <Text size="lg">Players: {gameState?.players.length}</Text>
        </Group>
        <Group justify="center" mt="xl">
          <Button
            color="green"
            onClick={handleStartVote}
            disabled={isVoteDisabled}
          >
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
