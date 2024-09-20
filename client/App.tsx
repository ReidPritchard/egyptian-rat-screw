import React, { useState, useEffect } from 'react';
import { ClientGame } from './ClientGame';
import { api } from './api';
import { MantineProvider, Container, LoadingOverlay } from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { SocketEvents } from './socketEvents';
import { PlayerInfo } from './types';
import { config } from './config';

export function App() {
  const preferredColorScheme = useColorScheme();
  const [localPlayer, setLocalPlayer] = useState<PlayerInfo | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
    <MantineProvider defaultColorScheme={preferredColorScheme}>
      <Container>
        <LoadingOverlay visible={!isConnected || !localPlayer} />
        {isConnected && localPlayer && <ClientGame localPlayer={localPlayer} />}
      </Container>
    </MantineProvider>
  );
}
