import { Container } from '@mantine/core';
import React from 'react';
import { ActionAnimation } from '../animations/ActionAnimation';
import { useApplicationContext } from '../hooks/ApplicationState';
import { GameBoard } from './GameBoard';
import { GameHeader } from './GameHeader';
import { PlayerActions } from './PlayerActions';

export const Game: React.FC = () => {
  const { isGameStarting } = useApplicationContext();

  if (isGameStarting) {
    return null; // Don't render game content while the start animation is showing
  }

  return (
    <Container size="md" p="lg">
      <GameHeader />
      <GameBoard />
      <PlayerActions />
      <ActionAnimation />
    </Container>
  );
};
