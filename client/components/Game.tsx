import React, { useState, useEffect } from 'react';
import {
  Container,
  Group,
  Text,
  Stack,
  Button,
  Tooltip,
  Box,
  Title,
  NumberInput,
  MultiSelect,
  Modal,
  Drawer,
  Tabs,
  ActionIcon,
  Paper,
  Badge,
  Grid,
  Flex,
} from '@mantine/core';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, Card, PlayerAction, SlapRule, GameSettings, PlayerActionResult } from '../types';
import { CardStack } from './CardStack';
import { BottomCard } from './BottomCard';
import { ActionLog } from './ActionLog';
import { SlapResult } from './SlapResult';
import { GameOver } from './GameOver';
import { CustomSlapRuleBuilder } from './CustomSlapRuleBuilder';
import {
  IconCards,
  IconHandStop,
  IconSettings,
  IconReload,
  IconUsers,
  IconClipboardList,
  IconDoorExit,
} from '@tabler/icons-react';
import { TurnOrder } from './TurnOrder';
import { Vote } from './Vote';
import { api } from '../api';

interface GameProps {
  gameState: GameState;
  gameSettings: GameSettings;
  allSlapRules: SlapRule[];
  localPlayer: { id: string; name: string };
  otherPlayers: { id: string; name: string }[];
  lastSlapResult: boolean | null;
  bottomCard: Card | null;
  playerActionLog: (PlayerAction | PlayerActionResult)[];
  isActionLogExpanded: boolean;
  handlePlayCard: () => void;
  handleSlap: () => void;
  handleGameSettingsChange: (settings: GameSettings) => void;
  toggleActionLog: () => void;
  handleLeaveGame: () => void;
  handleVoteToStartGame: (vote: boolean) => void;
}

export const Game: React.FC<GameProps> = ({
  gameState,
  gameSettings,
  allSlapRules,
  localPlayer,
  lastSlapResult,
  bottomCard,
  playerActionLog,
  isActionLogExpanded,
  handlePlayCard,
  handleSlap,
  handleGameSettingsChange,
  handleVoteToStartGame,
  toggleActionLog,
  handleLeaveGame,
}) => {
  const [isCustomRuleModalOpen, setIsCustomRuleModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [voteToStartGame, setVoteToStartGame] = useState<boolean | null>(null);

  const handleSaveCustomRule = (newRule: SlapRule) => {
    const updatedRules = [...allSlapRules, newRule];
    handleGameSettingsChange({
      ...gameSettings,
      slapRules: updatedRules,
    });
    setIsCustomRuleModalOpen(false);
  };

  const isLocalPlayerTurn = gameState.currentPlayerId === localPlayer.id;

  useEffect(() => {
    if (gameState.voteState) {
      setVoteToStartGame(gameState.voteState.votes.some((v) => v.vote));
    }
  }, [gameState.voteState]);

  const handleStartVote = () => {
    api.startVote('startGame');
  };

  return (
    <Container size="sm" p="lg">
      <AnimatePresence>
        {gameState.voteState && (
          <motion.div
            key="vote"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
          >
            <Vote
              isVoteOpen={true}
              yesCount={gameState.voteState.votes.filter((v) => v.vote).length}
              noCount={gameState.voteState.votes.filter((v) => !v.vote).length}
              totalPlayers={gameState.voteState.totalPlayers}
              onVote={handleVoteToStartGame}
              label={gameState.voteState.topic}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        key="game"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper shadow="xs" p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={3}>{gameState.name}</Title>
            <Badge color={isLocalPlayerTurn ? 'green' : 'blue'} size="lg">
              {isLocalPlayerTurn ? 'Your Turn' : `${gameState.playerNames[gameState.currentPlayerId]}'s Turn`}
            </Badge>
            {gameState.cardChallenge && (
              <Badge color={gameState.cardChallenge.result === 'challenger' ? 'red' : 'green'} size="lg">
                {gameState.cardChallenge.active ? (
                  <Group>
                    <Text>
                      {gameState.cardChallenge.challenger.name} challenged {gameState.cardChallenge.challenged.name}
                    </Text>
                    <Text>{gameState.cardChallenge.remainingCounterChances} remaining counter chances</Text>
                  </Group>
                ) : (
                  <Text>Challenge Result: {gameState.cardChallenge.result} won</Text>
                )}
              </Badge>
            )}
          </Group>

          <Grid justify="center" align="flex-start">
            {/* Game */}
            <Grid.Col span={8}>
              <Box my="md">
                <Text ta="center" size="sm" mb="xs">
                  Pile Size: {gameState.pile?.length ?? 0}
                </Text>
                <Group justify="center" mb="xl">
                  {bottomCard && <BottomCard bottomCard={bottomCard} />}
                  <CardStack pile={gameState.pile} />
                </Group>
              </Box>
            </Grid.Col>
            {/* Player List */}
            <Grid.Col span={4}>
              <TurnOrder gameState={gameState} localPlayerId={localPlayer.id} />
            </Grid.Col>
            <Grid.Col span={12}>
              <Group justify="center" mt="xl">
                <Tooltip label="Play a card from your hand">
                  <ActionIcon
                    size="xl"
                    variant="filled"
                    color="blue"
                    onClick={handlePlayCard}
                    disabled={gameState.gameOver || !isLocalPlayerTurn}
                  >
                    <IconCards size="1.5rem" />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Slap the pile if you think it's a valid slap">
                  <ActionIcon size="xl" variant="filled" color="red" onClick={handleSlap} disabled={gameState.gameOver}>
                    <IconHandStop size="1.5rem" />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Grid.Col>
            {/* Actions */}
            <Grid.Col span={12}>
              <Group justify="space-between" mt="xl">
                <Tooltip label="Start Vote to Restart Game">
                  <ActionIcon variant="filled" color="green" onClick={handleStartVote}>
                    <IconReload size="1.2rem" />
                  </ActionIcon>
                </Tooltip>
                <Group>
                  <Tooltip label="Leave Game">
                    <ActionIcon variant="filled" color="red" onClick={handleLeaveGame}>
                      <IconDoorExit size="1.2rem" />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Game Settings">
                    <ActionIcon variant="subtle" onClick={() => setIsSettingsOpen(true)}>
                      <IconSettings size="1.2rem" />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Grid.Col>
            {/* Action Log */}
            <Grid.Col span={12}>
              <ActionLog
                gameState={gameState}
                playerActionLog={playerActionLog}
                isActionLogExpanded={isActionLogExpanded}
                toggleActionLog={toggleActionLog}
              />
            </Grid.Col>
          </Grid>
        </Paper>
      </motion.div>

      <SlapResult lastSlapResult={lastSlapResult} />
      <GameOver gameState={gameState} localPlayerId={localPlayer.id} />

      <Drawer
        opened={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Game Settings"
        padding="xl"
        size="sm"
      >
        <Stack>
          <NumberInput
            label="Max Players"
            value={gameSettings.maximumPlayers}
            onChange={(value) => handleGameSettingsChange({ ...gameSettings, maximumPlayers: Number(value) })}
            min={2}
            max={8}
          />
          <MultiSelect
            label="Slap Rules"
            data={allSlapRules
              .filter((rule) => rule && rule.name)
              .map((rule) => ({ value: rule.name, label: rule.name }))}
            value={gameSettings.slapRules.map((rule: SlapRule) => rule.name)}
            onChange={(selectedRules) =>
              handleGameSettingsChange({
                ...gameSettings,
                slapRules: selectedRules.map((rule) => gameSettings.slapRules.find((r) => r.name === rule)!),
              })
            }
            placeholder="Select slap rules"
          />
          <Button onClick={() => setIsCustomRuleModalOpen(true)}>Create Custom Rule</Button>
        </Stack>
      </Drawer>

      <Modal
        opened={isCustomRuleModalOpen}
        onClose={() => setIsCustomRuleModalOpen(false)}
        title="Create Custom Slap Rule"
      >
        <CustomSlapRuleBuilder onSaveRule={handleSaveCustomRule} />
      </Modal>
    </Container>
  );
};
