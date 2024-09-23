import React, { useEffect, useState } from 'react';
import { Button, Group, Modal, Text, Stack, Progress, Container } from '@mantine/core';
import { api } from '../api';
import { GameState } from '../types';

const voteLabels = {
  startGame: 'Vote to start the game',
  endGame: 'Vote to end the game',
  restartGame: 'Vote to restart the game',
};

interface VoteProps {
  gameState: GameState;
  onVote: (vote: boolean) => void;
}

export const Vote: React.FC<VoteProps> = ({ gameState, onVote }) => {
  const [voteToStartGame, setVoteToStartGame] = useState<boolean | null>(null);

  useEffect(() => {
    if (gameState.voteState) {
      setVoteToStartGame(gameState.voteState.votes.some((v: { vote: boolean }) => v.vote));
    }
  }, [gameState.voteState]);

  const handleStartVote = () => {
    api.startVote('startGame');
  };

  const yesCount = gameState.voteState?.votes.filter((v: { vote: boolean }) => v.vote).length ?? 0;
  const noCount = gameState.voteState?.votes.filter((v: { vote: boolean }) => !v.vote).length ?? 0;
  const totalPlayers = gameState.voteState?.totalPlayers ?? 0;
  const totalVotes = yesCount + noCount;
  const yesPercentage = (yesCount / totalPlayers) * 100;
  const noPercentage = (noCount / totalPlayers) * 100;
  const remainingPercentage = 100 - yesPercentage - noPercentage;

  return (
    <Container size="sm" p="md">
      <Text>{voteLabels[gameState.voteState?.topic as keyof typeof voteLabels] ?? gameState.voteState?.topic}</Text>
      <Stack>
        <Progress.Root size="xl">
          <Progress.Section value={yesPercentage} color="green" />
          <Progress.Section value={noPercentage} color="red" />
          <Progress.Section value={remainingPercentage} color="gray" />
        </Progress.Root>
        <Group>
          <Text>Yes: {yesCount}</Text>
          <Text>No: {noCount}</Text>
          <Text>Remaining: {totalPlayers - totalVotes}</Text>
        </Group>
        <Group>
          <Button color="green" onClick={() => onVote(true)}>
            Vote Yes
          </Button>
          <Button color="red" onClick={() => onVote(false)}>
            Vote No
          </Button>
        </Group>
      </Stack>
    </Container>
  );
};
