import React, { useEffect, useState } from 'react';
import { IconCircle, IconChevronRight } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientGameState } from '../types';

interface TurnOrderProps {
  gameState: ClientGameState;
  localPlayerId: string;
}

export const TurnOrder: React.FC<TurnOrderProps> = ({ gameState, localPlayerId }) => {
  const currentPlayerIndex = gameState.currentPlayerId;
  const players = gameState.playerNames;

  return (
    <div className="w-full">
      <AnimatePresence>
        <ul className="steps">
          {gameState.playerIds.map((playerId, index) => (
            <motion.li
              key={playerId}
              className={`step ${playerId === currentPlayerIndex ? 'step-primary' : 'step-neutral'}`}
              data-content={playerId === localPlayerId ? '★' : ''}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <p className={`text-sm flex flex-row justify-between ${playerId === localPlayerId ? 'font-bold' : ''}`}>
                {players[playerId]}
                <p className="text-xs text-gray-500">({gameState.playerHandSizes[playerId]})</p>
              </p>
            </motion.li>
          ))}
        </ul>
      </AnimatePresence>
    </div>
  );
};
