import React, { useState, useEffect } from 'react';
import { ClientGame } from './ClientGame';
import { api } from './api';
import { ClientPlayer } from './ClientPlayer';
import { MantineProvider, Container, LoadingOverlay } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';

export function App() {
  const preferredColorScheme = useColorScheme();
  const [localPlayer, setLocalPlayer] = useState<ClientPlayer | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initialName = localStorage.getItem('playerName') ?? '';

    api.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      // Ensure socket.id is available
      if (api.socket.id) {
        setLocalPlayer(new ClientPlayer(api.socket.id, initialName));
      } else {
        console.error('Socket ID not available');
      }
    });

    api.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setLocalPlayer(null);
    });

    return () => {
      // Clean up listeners if necessary
      api.removeAllListeners('connect');
      api.removeAllListeners('disconnect');
    };
  }, []);

  return (
    <MantineProvider defaultColorScheme={preferredColorScheme}>
      <Container>
        <LoadingOverlay visible={!isConnected || !localPlayer} />
        {isConnected && localPlayer && <ClientGame localPlayer={localPlayer} />}
      </Container>
    </MantineProvider>
  );
}
