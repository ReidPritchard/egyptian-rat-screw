import { Button, Group, Modal, Text, Stack, Progress, ProgressSection } from '@mantine/core';
import React from 'react';

interface VoteProps {
  onVote: (vote: boolean) => void;
  label: string;
  yesCount: number;
  noCount: number;
  isVoteOpen: boolean;
}

export const Vote = ({ onVote, yesCount, noCount, isVoteOpen, label }: VoteProps) => {
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
