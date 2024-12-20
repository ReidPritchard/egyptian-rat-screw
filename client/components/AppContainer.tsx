import React from 'react';
import { ApplicationStore, useApplicationStore } from '../hooks/useApplicationStore';
import { Game } from './Game';
import { Lobby } from './Lobby';
import { ThemeToggle } from './ThemeToggle';
import { NavBar } from './NavBar';

export const AppContainer: React.FC = () => {
  const { userLocation } = useApplicationStore((state: ApplicationStore) => state);
  console.log('userLocation', userLocation);

  return (
    <div className="flex flex-col h-screen w-screen bg-base-300 gap-8">
      <NavBar />

      <div className="flex-grow">{userLocation === 'lobby' ? <Lobby /> : <Game />}</div>
    </div>
  );
};
