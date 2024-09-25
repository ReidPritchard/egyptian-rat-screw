import { Container, createTheme, LoadingOverlay, MantineProvider } from '@mantine/core';
import React, { useEffect, useState } from 'react';
import { api } from './api';
import { AppContainer } from './components/AppContainer';
import { ApplicationProvider } from './hooks/ApplicationState';
import { SocketEvents } from './socketEvents';

export const App: React.FC = () => {
  // Track connection state
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    api.on(SocketEvents.CONNECT, () => {
      setIsConnected(true);
    });

    api.on(SocketEvents.DISCONNECT, () => {
      setIsConnected(false);
    });
  }, []);

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

  return (
    <MantineProvider theme={theme}>
      <Container>
        <LoadingOverlay visible={!isConnected} />
        <ApplicationProvider>
          <AppContainer />
        </ApplicationProvider>
      </Container>
    </MantineProvider>
  );
};
