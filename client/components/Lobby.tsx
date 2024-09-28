import { Button, Container, Flex, Paper, Space, Stack, Text, TextInput, Title, Tooltip } from '@mantine/core';
import { useLocalStorage, useThrottledCallback } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { ChangeNamePayload } from 'client/socketEvents';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect } from 'react';
import { api } from '../api';
import { config } from '../config';
import { useApplicationContext } from '../hooks/ApplicationState';

export const Lobby: React.FC = () => {
  const { lobbyState, lobbyPlayers, localPlayer } = useApplicationContext();

  const [playerName, setPlayerName] = useLocalStorage({
    key: config.localStoragePlayerNameKey,
    defaultValue: localPlayer?.name || '',
  });

  useEffect(() => {
    const handleConnect = () => {
      if (playerName) {
        api.changeName({ name: playerName });
      }
    };

    api.socket.on('connect', handleConnect);

    return () => {
      api.socket.off('connect', handleConnect);
    };
  }, [playerName]);

  // throttle name change
  const throttledChangeName = useThrottledCallback((payload: ChangeNamePayload) => api.changeName(payload), 1000);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setPlayerName(newName);
    if (api.socket.connected) {
      throttledChangeName({ name: newName });
    }
  };

  const handleJoinGame = (gameId: string) => {
    api.joinGame({ gameId });
  };

  const handleCreateGame = () => {
    api.createGame({ playerName });
  };

  // Re-render when a player joins or leaves the lobby
  useEffect(() => {
    console.log('lobbyPlayers', lobbyPlayers);
  }, [lobbyPlayers]);

  return (
    <Container w="100%">
      <Flex direction={'row'} align={'flex-end'} justify={'center'}>
        <TextInput
          label={'Name'}
          description={'This is your name that will be displayed to other players'}
          placeholder="Your Name"
          value={playerName}
          onChange={handleNameChange}
          style={{ flex: 1 }}
          withAsterisk
        />
        <Space w="10px" />
        <Tooltip label="Create Game">
          <Button onClick={handleCreateGame} disabled={!playerName} leftSection={<IconPlus size="1.1rem" />}>
            Create Game
          </Button>
        </Tooltip>
      </Flex>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Paper style={{ marginTop: '20px', padding: '10px' }}>
          <Title order={3}>Players ({lobbyPlayers.length})</Title>
          <br />
          <Flex direction="column" align="flex-start">
            <AnimatePresence>
              {lobbyPlayers.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Text>
                    {player.name}
                    {player.id === localPlayer?.id && ' (You)'}
                  </Text>
                </motion.div>
              ))}
            </AnimatePresence>
          </Flex>
        </Paper>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Paper style={{ marginTop: '20px', padding: '10px' }}>
          <Title order={3}>Games</Title>
          <br />
          <Stack>
            <AnimatePresence>
              {lobbyState?.games.map((game) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Flex align="center" justify="center" w="100%">
                    <Paper withBorder p={10} w="80%">
                      <Flex justify="space-between" align="center" w="100%">
                        <div>
                          <Text size="lg" p={3}>
                            {game.name}
                          </Text>
                          <Text size="xs" p={3}>
                            Players: {game.playerCount}/{game.maxPlayers}
                          </Text>
                        </div>
                        <Button onClick={() => handleJoinGame(game.id)}>Join</Button>
                      </Flex>
                    </Paper>
                  </Flex>
                </motion.div>
              ))}
            </AnimatePresence>
          </Stack>
        </Paper>
      </motion.div>
    </Container>
  );
};
