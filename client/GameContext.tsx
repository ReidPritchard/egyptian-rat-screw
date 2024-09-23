// client/GameContext.tsx

import React, { createContext, useState, useEffect } from 'react';
import { GameState as ClientGameState } from './types';
import { SocketEvents } from './socketEvents';
export const GameContext = createContext<ClientGameState | null>(null);

export const GameProvider: React.FC = ({ children }) => {
  const [gameState, setGameState] = useState<ClientGameState | null>(null);

  useEffect(() => {
    // Set up socket connection and listeners
    socket.on(SocketEvents.GAME_UPDATE, (updatedGameState: ClientGameState) => {
      setGameState(updatedGameState);
    });

    return () => {
      // Clean up socket listeners on unmount
      socket.off(SocketEvents.GAME_UPDATE);
    };
  }, []);

  return <GameContext.Provider value={gameState}>{children}</GameContext.Provider>;
};
