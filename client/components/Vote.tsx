import React from 'react';
import { Button, Group, Modal, Text, Stack, Progress, ProgressSection } from '@mantine/core';

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
  const yesPercentage = totalVotes > 0 ? (yesCount / totalVotes) * 100 : 0;

  return (
    <Modal opened={isVoteOpen} onClose={() => {}} title={label} centered>
      <Stack>
        <Progress value={yesPercentage} color="green" size="xl">
          <ProgressSection value={yesPercentage} color="green" />
          <ProgressSection value={100 - yesPercentage} color="red" />
        </Progress>
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
