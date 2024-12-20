import React, { useEffect, useState } from 'react';
import { useGameStore } from '../hooks/useGameStore';
import { useApplicationStore } from '../hooks/useApplicationStore';
import { newLogger } from '../logger';
import { GameBoard } from './GameBoard';
import { GameHeader } from './GameHeader';
import { PlayerActions } from './PlayerActions';

const logger = newLogger('Game');

export const Game: React.FC = () => {
  const { isGameStarting, gameState } = useGameStore();
  const { localPlayer } = useApplicationStore();

  // UI for card challenges
  const [cardChallengeStyle, setCardChallengeStyle] = useState<string>('');

  useEffect(() => {
    if (gameState?.cardChallenge && gameState.cardChallenge.active) {
      logger.info('Card challenge', gameState.cardChallenge);

      const isChallenger = gameState.cardChallenge.challenger.id === localPlayer?.id;
      setCardChallengeStyle(
        `border-2 border-${isChallenger ? 'pink' : 'green'} text-${isChallenger ? 'white' : 'black'}`,
      );
    } else {
      setCardChallengeStyle('');
    }
  }, [gameState?.cardChallenge]);

  return (
    <div className={`h-full w-full p-4 rounded-lg flex-1 flex flex-col ${cardChallengeStyle}`}>
      <GameHeader />
      <div className="flex-grow">
        <GameBoard />
      </div>
      <PlayerActions />
    </div>
  );
};
