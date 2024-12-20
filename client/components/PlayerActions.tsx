import { useHotkeys } from '@mantine/hooks';
import { IconHandStop, IconPlayCard, IconPlayerPlay, IconSettings } from '@tabler/icons-react';
import React from 'react';
import { api } from '../api';
import { GameStage } from '../types';
import { useApplicationStore } from '../hooks/useApplicationStore';
import { useGameStore } from '../hooks/useGameStore';
import { useLocalPlayerSettings } from '../hooks/useLocalPlayerSettings';

export const PlayerActions: React.FC = () => {
  const { localPlayer } = useApplicationStore();
  const { isLocalPlayerTurn, gameState } = useGameStore();
  const { settings: localPlayerSettings } = useLocalPlayerSettings();

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
        <div className="tooltip tooltip-primary" data-tip="Game settings (g)">
          <button className="btn btn-outline btn-lg" onClick={() => console.log('Game settings')}>
            <IconSettings size="1.5rem" />
          </button>
        </div>
      );
    }
  };

  const renderStartGameAction = () => {
    if (gameState?.stage === GameStage.PRE_GAME && localPlayer) {
      return (
        <div className="tooltip tooltip-primary" data-tip="Ready up">
          <button className="btn btn-lg btn-success" onClick={() => api.playerReady(localPlayer)}>
            <IconPlayerPlay size="1.5rem" />
          </button>
        </div>
      );
    }
  };

  const renderPlayCardAction = () => {
    if (gameState?.stage === GameStage.PLAYING) {
      return (
        <div className="tooltip tooltip-primary" data-tip="Play a card (n)">
          <button className="btn btn-outline btn-lg" onClick={() => api.playCard({})} disabled={!isLocalPlayerTurn}>
            <IconPlayCard size="1.5rem" />
          </button>
        </div>
      );
    }
  };

  const renderSlapPileAction = () => {
    if (gameState?.stage === GameStage.PLAYING) {
      return (
        <div className="tooltip tooltip-primary" data-tip="Slap the pile if you think it's a valid slap (space)">
          <button className="btn btn-outline btn-lg" onClick={() => api.slapPile({ playerId: localPlayer?.id })}>
            <IconHandStop size="1.5rem" />
          </button>
        </div>
      );
    }
  };

  return (
    <div className="navbar bg-base-100">
      <div className="navbar-start flex-1"></div>
      <div className="navbar-center gap-2">
        {renderGameSettingsAction()}
        {renderStartGameAction()}
        {renderPlayCardAction()}
        {renderSlapPileAction()}
      </div>
      <div className="navbar-end flex-1"></div>
    </div>
  );
};
