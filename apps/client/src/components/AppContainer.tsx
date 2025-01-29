import React from 'react';
import { ApplicationStore, useApplicationStore } from '../hooks/useApplicationStore';
import { Game } from './Game';
import { Lobby } from './Lobby';
import { NavBar } from './NavBar';

import { newLogger } from '../logger';

const logger = newLogger('AppContainer');

export const AppContainer: React.FC = () => {
  const { userLocation } = useApplicationStore((state: ApplicationStore) => state);
  logger.info(`userLocation: ${userLocation}`);

  return (
    <div className="flex flex-col h-screen w-screen bg-base-300 gap-8">
      <NavBar />

      <div className="flex-grow">{userLocation === 'lobby' ? <Lobby /> : <Game />}</div>
    </div>
  );
};
