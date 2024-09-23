import React, { useState, useEffect } from 'react';
import { GameContainer } from './GameContainer';
import { api } from './api';
import { createTheme, MantineProvider, Container, LoadingOverlay } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { SocketEvents } from './socketEvents';
import { PlayerInfo } from './types';
import { config } from './config';

export function App() {
  const preferredColorScheme = useColorScheme();
  const [localPlayer, setLocalPlayer] = useState<PlayerInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const theme = createTheme({
    primaryColor: 'rat-blue',
    colors: {
      // Light pink #FFC0CB
      'rat-ears-pink': [
        '#FFC0CB',
        '#FFC0CB',
        '#FFC0CB',
        '#FFC0CB',
        '#FFC0CB',
        '#FFC0CB',
        '#FFC0CB',
        '#FFC0CB',
        '#FFC0CB',
        '#FFC0CB',
        '#FFC0CB',
      ],
      // Start at #9BC0E1
      'rat-blue': [
        '#9BC0E1',
        '#9BC0E1',
        '#9BC0E1',
        '#9BC0E1',
        '#9BC0E1',
        '#9BC0E1',
        '#9BC0E1',
        '#9BC0E1',
        '#9BC0E1',
        '#9BC0E1',
      ],
    },
  });

  useEffect(() => {
    const initialName = localStorage.getItem(config.localStoragePlayerNameKey) ?? '';
    api.setPlayerName(initialName);

    api.socket.on(SocketEvents.CONNECT, () => {
      console.log('Connected to server');
      setIsConnected(true);
      if (api.socket.id) {
        setLocalPlayer({ id: api.socket.id, name: initialName });
      } else {
        console.error('Socket ID not available');
      }
    });

    api.socket.on(SocketEvents.DISCONNECT, () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setLocalPlayer(null);
    });

    return () => {
      api.socket.removeAllListeners('connect');
      api.socket.removeAllListeners('disconnect');
    };
  }, []);

  return (
    <MantineProvider theme={theme} defaultColorScheme={preferredColorScheme}>
      <Container>
        <LoadingOverlay visible={!isConnected || !localPlayer} />
        {isConnected && localPlayer && <GameContainer localPlayer={localPlayer} />}
      </Container>
    </MantineProvider>
  );
}
