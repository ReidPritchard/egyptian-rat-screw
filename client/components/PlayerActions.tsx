import { ActionIcon, Group, Tooltip } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';
import { IconHandStop, IconPlayCard, IconPlayerPlay, IconSettings } from '@tabler/icons-react';
import React from 'react';
import { api } from '../api';
import { useApplicationContext } from '../hooks/ApplicationState';
import { GameStage } from '../types';

export const PlayerActions: React.FC = () => {
  const { isLocalPlayerTurn, gameState, localPlayerSettings, localPlayer } = useApplicationContext();

  const gameOver = gameState?.stage === GameStage.GAME_OVER;

  useHotkeys(
    [
      [
        localPlayerSettings.hotkeys.slap,
        () => {
          if (!gameOver && localPlayer) {
            api.slapPile({
              playerId: localPlayer.id,
            });
          }
        },
      ],
      [
        localPlayerSettings.hotkeys.playCard,
        () => {
          if (!gameOver && isLocalPlayerTurn) {
            api.playCard({});
          }
        },
      ],
    ],
    ['INPUT', 'TEXTAREA'],
  );

  const renderGameSettingsAction = () => {
    if (gameState?.stage === GameStage.PRE_GAME) {
      return (
        <Tooltip label="Game settings (g)">
          <ActionIcon size="xl" variant="filled" color="blue" onClick={() => console.log('Game settings')}>
            <IconSettings size="1.5rem" />
          </ActionIcon>
        </Tooltip>
      );
    }
  };

  const renderStartGameAction = () => {
    if (gameState?.stage === GameStage.PRE_GAME && localPlayer) {
      return (
        <Tooltip label="Ready up">
          <ActionIcon size="xl" variant="filled" color="green" onClick={() => api.playerReady(localPlayer)}>
            <IconPlayerPlay size="1.5rem" />
          </ActionIcon>
        </Tooltip>
      );
    }
  };

  const renderPlayCardAction = () => {
    if (gameState?.stage === GameStage.PLAYING) {
      return (
        <Tooltip label="Play a card (n)">
          <ActionIcon
            size="xl"
            variant="filled"
            color="blue"
            onClick={() => api.playCard({})}
            disabled={!isLocalPlayerTurn}
          >
            <IconPlayCard size="1.5rem" />
          </ActionIcon>
        </Tooltip>
      );
    }
  };

  const renderSlapPileAction = () => {
    if (gameState?.stage === GameStage.PLAYING) {
      return (
        <Tooltip label="Slap the pile if you think it's a valid slap (space)">
          <ActionIcon
            size="xl"
            variant="filled"
            color="red"
            onClick={() => api.slapPile({ playerId: localPlayer?.id })}
          >
            <IconHandStop size="1.5rem" />
          </ActionIcon>
        </Tooltip>
      );
    }
  };

  return (
    <Group justify="center" mt="xl">
      {renderGameSettingsAction()}
      {renderStartGameAction()}
      {renderPlayCardAction()}
      {renderSlapPileAction()}
    </Group>
  );
};
