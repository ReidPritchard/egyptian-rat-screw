import React from 'react';
import { Group, Tooltip, ActionIcon } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { IconCards, IconHandStop } from '@tabler/icons-react';

interface PlayerActionsProps {
  handlePlayCard: () => void;
  handleSlap: () => void;
  isLocalPlayerTurn: boolean;
  gameOver: boolean;
  hotkeys: {
    playCard: string;
    slap: string;
  };
}

export const PlayerActions: React.FC<PlayerActionsProps> = ({
  handlePlayCard,
  handleSlap,
  isLocalPlayerTurn,
  gameOver,
  hotkeys,
}) => {
  useHotkeys(
    [
      [
        hotkeys.slap,
        () => {
          if (!gameOver) {
            handleSlap();
          }
        },
      ],
      [
        hotkeys.playCard,
        () => {
          if (!gameOver && isLocalPlayerTurn) {
            handlePlayCard();
          }
        },
      ],
    ],
    ['INPUT', 'TEXTAREA'],
  );

  return (
    <Group justify="center" mt="xl">
      <Tooltip label="Play a card from your hand (n)">
        <ActionIcon
          size="xl"
          variant="filled"
          color="blue"
          onClick={handlePlayCard}
          disabled={gameOver || !isLocalPlayerTurn}
        >
          <IconCards size="1.5rem" />
        </ActionIcon>
      </Tooltip>
      <Tooltip label="Slap the pile if you think it's a valid slap (space)">
        <ActionIcon size="xl" variant="filled" color="red" onClick={handleSlap} disabled={gameOver}>
          <IconHandStop size="1.5rem" />
        </ActionIcon>
      </Tooltip>
    </Group>
  );
};
