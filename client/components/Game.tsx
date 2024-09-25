import { Paper } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { useApplicationContext } from '../hooks/ApplicationState';
import { GameBoard } from './GameBoard';
import { GameHeader } from './GameHeader';
import { PlayerActions } from './PlayerActions';

export const Game: React.FC = () => {
  const { isGameStarting, gameState, localPlayer } = useApplicationContext();

  if (isGameStarting) {
    return null; // Don't render game content while the start animation is showing
  }

  // UI for card challenges
  const [cardChallengeStyle, setCardChallengeStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (gameState?.cardChallenge) {
      const isChallenger = gameState.cardChallenge.challenger.id === localPlayer?.id;
      setCardChallengeStyle({
        backgroundColor: isChallenger ? 'rat-ear-pink' : 'green',
        color: isChallenger ? 'white' : 'black',
      });
    }
  }, [gameState?.cardChallenge]);

  return (
    <Paper p="lg" radius="md" bg={cardChallengeStyle.backgroundColor}>
      <GameHeader />
      <GameBoard />
      <PlayerActions />
    </Paper>
  );
};
