import React from 'react';
import { Alert, Transition } from '@mantine/core';
import { GameState } from '../types';

interface GameOverProps {
  gameState: GameState;
  localPlayerId: string;
}

export const GameOver: React.FC<GameOverProps> = ({ gameState, localPlayerId }) => {
  if (!gameState.gameOver) return null;

  return (
    <Transition mounted={gameState.gameOver} transition="slide-up" duration={400} timingFunction="ease">
      {(styles) => (
        <Alert title="Game Over!" color="blue" style={{ ...styles, marginTop: '20px' }}>
          {gameState.winner && gameState.winner.id === localPlayerId
            ? 'Congratulations! You won the game!'
            : `${gameState.winner!.name} wins!`}
        </Alert>
      )}
    </Transition>
  );
};