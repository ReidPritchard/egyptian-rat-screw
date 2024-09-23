import React from 'react';
import { Button, Group, Modal, Text, Stack, Progress, Container } from '@mantine/core';

const voteLabels = {
  gameStart: 'Do you want to start the game?',
  gameEnd: 'Do you want to end the game?',
  gameRestart: 'Do you want to restart the game?',
};

interface VoteProps {
  onVote: (vote: boolean) => void;
  label: string;
  yesCount: number;
  noCount: number;
  isVoteOpen: boolean;
  totalPlayers: number;
}

export const Vote: React.FC<VoteProps> = ({ onVote, yesCount, noCount, isVoteOpen, label, totalPlayers }) => {
  const totalVotes = yesCount + noCount;

  // Calculate percentages relative to total players
  const yesPercentage = (yesCount / totalPlayers) * 100;
  const noPercentage = (noCount / totalPlayers) * 100;
  const remainingPercentage = 100 - yesPercentage - noPercentage;

  return (
    <Container size="sm" p="md">
      {/* Render the vote label */}
      <Text>{voteLabels[label as keyof typeof voteLabels]}</Text>
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
