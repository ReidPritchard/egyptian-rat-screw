import React, { useEffect, useState } from 'react';
import {
  Container,
  Title,
  Paper,
  Text,
  Stack,
  Group,
  Button,
  Flex,
  TextInput,
  Tooltip,
  ActionIcon,
  Space,
} from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { LobbyState, PlayerInfo } from '../types';
import { IconPlus, IconLogin } from '@tabler/icons-react';

interface LobbyProps {
  lobbyState: LobbyState | null;
  handleJoinGame: (gameId: string) => void;
  handleCreateGame: () => void;
  localPlayer: PlayerInfo;
  playerName: string;
  handleNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  lobbyState,
  handleJoinGame,
  handleCreateGame,
  localPlayer,
  playerName,
  handleNameChange,
}) => {
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
      {lobbyState && (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Paper style={{ marginTop: '20px', padding: '10px' }}>
              <Title order={3}>Players ({lobbyState.players.length})</Title>
              <br />
              <Flex direction="column" align="flex-start">
                <AnimatePresence>
                  {lobbyState.players.map((player) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Text>
                        {player.name}
                        {player.id === localPlayer.id && ' (You)'}
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
                  {lobbyState.games.map((game) => (
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
        </>
      )}
    </Container>
  );
};
