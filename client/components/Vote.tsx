import React from 'react';
import { Button, Group, Modal, Text, Stack, Progress } from '@mantine/core';

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
    <Modal opened={isVoteOpen} onClose={() => {}} title={label} centered>
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
    </Modal>
  );
};
