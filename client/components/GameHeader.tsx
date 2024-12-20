import React from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { GameStage } from '../types';

export const GameHeader: React.FC = () => {
  const { gameState, isLocalPlayerTurn } = useGameStore();

  return (
    <div className="flex flex-row justify-between mb-4">
      {gameState?.stage === GameStage.PLAYING && (
        <div className={`badge ${isLocalPlayerTurn ? 'badge-accent' : 'badge-outline'}`}>
          {isLocalPlayerTurn ? 'Your Turn' : `${gameState?.playerNames[gameState.currentPlayerId]}'s Turn`}
        </div>
      )}
    </div>
  );
};
