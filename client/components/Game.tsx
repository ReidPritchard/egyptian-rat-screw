import { Flex, Paper } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { useApplicationContext } from '../hooks/ApplicationState';
import { newLogger } from '../logger';
import { GameBoard } from './GameBoard';
import { GameHeader } from './GameHeader';
import { PlayerActions } from './PlayerActions';

const logger = newLogger('Game');

export const Game: React.FC = () => {
  const { isGameStarting, gameState, localPlayer } = useApplicationContext();

  if (isGameStarting) {
    return null; // Don't render game content while the start animation is showing
  }

  // UI for card challenges
  const [cardChallengeStyle, setCardChallengeStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (gameState?.cardChallenge && gameState.cardChallenge.active) {
      logger.info('Card challenge', gameState.cardChallenge);

      const isChallenger = gameState.cardChallenge.challenger.id === localPlayer?.id;
      setCardChallengeStyle({
        border: `2px solid ${isChallenger ? 'rat-ear-pink' : 'green'}`,
        color: isChallenger ? 'white' : 'black',
      });
    } else {
      setCardChallengeStyle({});
    }
  }, [gameState?.cardChallenge]);

  return (
    <Flex direction="column" style={{ height: '100%', width: '100%' }}>
      <Paper
        p="lg"
        radius="md"
        bg={cardChallengeStyle.backgroundColor}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <GameHeader />
        <Flex style={{ overflow: 'hidden', flexGrow: 1 }}>
          <GameBoard />
        </Flex>
        <PlayerActions />
      </Paper>
    </Flex>
  );
};
