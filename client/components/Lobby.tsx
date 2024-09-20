import React from 'react';
import { Container, Title, Paper, Text, Stack, Group, Button } from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { LobbyState } from '../types';

interface LobbyProps {
  lobbyState: LobbyState;
  handleJoinGame: (gameId: string) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ lobbyState, handleJoinGame }) => {
  return (
    <Container>
      <Title order={2}>Lobby</Title>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Paper style={{ marginTop: '20px', padding: '10px' }}>
          <Title order={3}>Players</Title>
          <AnimatePresence>
            {lobbyState.players.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Text>{player.name}</Text>
              </motion.div>
            ))}
          </AnimatePresence>
        </Paper>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Paper style={{ marginTop: '20px', padding: '10px' }}>
          <Title order={3}>Games</Title>
          <Stack>
            <AnimatePresence>
              {lobbyState.games.map((game) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper withBorder>
                    <Group>
                      <div>
                        <Text size="lg">{game.name}</Text>
                        <Text size="xs">ID: {game.id}</Text>
                        <Text size="xs">
                          Players: {game.playerCount}/{game.maxPlayers}
                        </Text>
                      </div>
                      <Button onClick={() => handleJoinGame(game.id)}>Join</Button>
                    </Group>
                  </Paper>
                </motion.div>
              ))}
            </AnimatePresence>
          </Stack>
        </Paper>
      </motion.div>
    </Container>
  );
};
