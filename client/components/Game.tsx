import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Container,
  Drawer,
  Grid,
  Group,
  Modal,
  MultiSelect,
  NumberInput,
  Paper,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { IconCards, IconDoorExit, IconHandStop, IconReload, IconSettings } from '@tabler/icons-react';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { config } from '../config';
import { Card, GameSettings, GameState, PlayerAction, PlayerActionResult, SlapRule } from '../types';
import { ActionLog } from './ActionLog';
import { BottomCard } from './BottomCard';
import { CardStack } from './CardStack';
import { CustomSlapRuleBuilder } from './CustomSlapRuleBuilder';
import { GameOver } from './GameOver';
import { PreGame } from './PreGame';
import { SlapResult } from './SlapResult';
import { TurnOrder } from './TurnOrder';
import { Vote } from './Vote';
// import { useKeybindings } from '../hooks/useKeybindings'; // Assuming you have or will create this custom hook
import { useHotkeys } from '@mantine/hooks';

interface GameProps {
  gameState: GameState;
  gameSettings: GameSettings;
  allSlapRules: SlapRule[];
  localPlayer: { id: string; name: string };
  lastSlapResult: boolean | null;
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

  const isLocalPlayerTurn = gameState.currentPlayerId === localPlayer.id;

  const handleSaveCustomRule = (newRule: SlapRule) => {
    const updatedRules = [...allSlapRules, newRule];
    handleGameSettingsChange({
      ...gameSettings,
      slapRules: updatedRules,
    });
    setIsCustomRuleModalOpen(false);
  };

  useEffect(() => {
    if (gameState.voteState) {
      setVoteToStartGame(gameState.voteState.votes.some((v) => v.vote));
    }
  }, [gameState.voteState]);

  const handleStartVote = () => {
    api.startVote('startGame');
  };

  // Display the bottom card for a short duration when it changes
  const [bottomCardTrigger, setBottomCardTrigger] = useState(0);
  const [bottomCard, setBottomCard] = useState<Card | null>(null);
  useEffect(() => {
    setBottomCard(gameState.pile?.[0] ?? null);
    setBottomCardTrigger((prevTrigger) => prevTrigger + 1);
  }, [gameState.pile?.[0]?.code]);

  const renderVoteSection = () => (
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
  );

  const renderGameSection = () => (
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
                <BottomCard
                  bottomCard={bottomCard}
                  duration={config.game.bottomCardDisplayDuration}
                  key={bottomCardTrigger}
                />
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
              <Tooltip label="Play a card from your hand (n)">
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
              <Tooltip label="Slap the pile if you think it's a valid slap (space)">
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
  );

  const renderSettingsDrawer = () => (
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
  );

  const renderCustomRuleModal = () => (
    <Modal
      opened={isCustomRuleModalOpen}
      onClose={() => setIsCustomRuleModalOpen(false)}
      title="Create Custom Slap Rule"
    >
      <CustomSlapRuleBuilder onSaveRule={handleSaveCustomRule} />
    </Modal>
  );

  // Contains the logic for what UI is shown based on the game state
  const renderUI = () => {
    // If the game is in a vote state, only show the vote section
    if (gameState.voteState) {
      return renderVoteSection();
    }
    // If the game is over, show the game over section
    if (gameState.gameOver) {
      return <GameOver gameState={gameState} localPlayerId={localPlayer.id} />;
    }

    // If the game has not started, show the pre game section
    if (!gameState.gameStarted) {
      return <PreGame gameState={gameState} localPlayerId={localPlayer.id} />;
    }

    // If the game is not in a vote state, show the game section
    return renderGameSection();
  };

  useHotkeys(
    [
      [
        'space',
        () => {
          if (!gameState.gameOver) {
            handleSlap();
          }
        },
      ],
      [
        'n',
        () => {
          if (!gameState.gameOver && isLocalPlayerTurn) {
            handlePlayCard();
          }
        },
      ],
    ],
    ['INPUT', 'TEXTAREA'],
  );

  return (
    <Container size="sm" p="lg">
      {renderUI()}
      <SlapResult lastSlapResult={lastSlapResult} />

      {renderSettingsDrawer()}
      {renderCustomRuleModal()}
    </Container>
  );
};
