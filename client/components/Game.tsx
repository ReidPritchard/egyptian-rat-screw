import React, { useState } from 'react';
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
import { GameState, Card, PlayerAction, SlapRule } from '../types';
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

interface GameProps {
  gameState: GameState;
  allSlapRules: SlapRule[];
  localPlayer: { id: string; name: string };
  otherPlayers: { id: string; name: string }[];
  lastSlapResult: boolean | null;
  bottomCard: Card | null;
  playerActionLog: PlayerAction[];
  isActionLogExpanded: boolean;
  handlePlayCard: () => void;
  handleSlap: () => void;
  handleRestartGame: () => void;
  handleMaxPlayersChange: (value: string | undefined) => void;
  handleSlapRuleChange: (selectedRules: SlapRule[]) => void;
  toggleActionLog: () => void;
  handleLeaveGame: () => void;
}

export const Game: React.FC<GameProps> = ({
  gameState,
  allSlapRules,
  localPlayer,
  lastSlapResult,
  bottomCard,
  playerActionLog,
  isActionLogExpanded,
  handlePlayCard,
  handleSlap,
  handleRestartGame,
  handleMaxPlayersChange,
  handleSlapRuleChange,
  toggleActionLog,
  handleLeaveGame,
}) => {
  const [isCustomRuleModalOpen, setIsCustomRuleModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSaveCustomRule = (newRule: SlapRule) => {
    const updatedRules = [...allSlapRules, newRule];
    handleSlapRuleChange(updatedRules);
    setIsCustomRuleModalOpen(false);
  };

  const isLocalPlayerTurn = gameState.players[gameState.currentPlayer].id === localPlayer.id;

  return (
    <Container size="sm" p="lg">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Paper shadow="xs" p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={3}>{gameState.name}</Title>
            <Badge color={isLocalPlayerTurn ? 'green' : 'blue'} size="lg">
              {isLocalPlayerTurn ? 'Your Turn' : `${gameState.players[gameState.currentPlayer].name}'s Turn`}
            </Badge>
          </Group>

          <Grid justify="center" align="flex-start">
            {/* Game */}
            <Grid.Col span={8}>
              <Box my="md">
                <Text ta="center" size="sm" mb="xs">
                  Pile Size: {gameState.pileSize}
                </Text>
                <Group justify="center" mb="xl">
                  <BottomCard bottomCard={bottomCard} />
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
                <Tooltip label="Restart Game">
                  <ActionIcon variant="filled" color="green" onClick={handleRestartGame} disabled={!gameState.gameOver}>
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
            value={gameState.maxPlayers}
            onChange={(value) => handleMaxPlayersChange(value?.toString())}
            min={2}
            max={8}
          />
          <MultiSelect
            label="Slap Rules"
            data={gameState.slapRules
              .filter((rule) => rule && rule.name)
              .map((rule) => ({ value: rule.name, label: rule.name }))}
            value={gameState.slapRules.filter((rule) => rule && rule.name).map((rule) => rule.name)}
            onChange={(selectedRules) =>
              handleSlapRuleChange(selectedRules.map((rule) => gameState.slapRules.find((r) => r.name === rule)!))
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
