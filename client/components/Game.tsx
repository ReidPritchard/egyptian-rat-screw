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
import {
  Card,
  GameSettings,
  GameState,
  LocalPlayerSettings,
  PlayerAction,
  PlayerActionResult,
  PlayerActionType,
  SlapRule,
} from '../types';
import { ActionLog } from './ActionLog';
import { CustomSlapRuleBuilder } from './CustomSlapRuleBuilder';
import { GameOver } from './GameOver';
import { PreGame } from './PreGame';
import { SlapResult } from './SlapResult';
import { Vote } from './Vote';
import { GameHeader } from './GameHeader';
import { GameBoard } from './GameBoard';
import { PlayerActions } from './PlayerActions';
import { SettingsDrawer } from './SettingsDrawer';
import { GameAnimation } from './GameAnimation';

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
  playerActionLog,
  handlePlayCard,
  handleSlap,
  handleGameSettingsChange,
  handleVoteToStartGame,
  handleLeaveGame,
}) => {
  const [isCustomRuleModalOpen, setIsCustomRuleModalOpen] = useState(false);
  const [voteToStartGame, setVoteToStartGame] = useState<boolean | null>(null);

  const [localPlayerSettings, setLocalPlayerSettings] = useState<LocalPlayerSettings>({
    hotkeys: {
      playCard: 'space',
      slap: 's',
    },
  });

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

  // Track the last action that was performed for the animation
  const [lastAction, setLastAction] = useState<PlayerActionType | null>(null);
  useEffect(() => {
    if (playerActionLog.length > 0) {
      const lastLogEntry = playerActionLog[playerActionLog.length - 1];
      setLastAction(lastLogEntry.actionType);
    }
  }, [playerActionLog]);

  // Try to load local player settings from localStorage
  useEffect(() => {
    const settings = localStorage.getItem(config.localStoragePlayerSettingsKey);
    if (settings) {
      setLocalPlayerSettings(JSON.parse(settings));
    }
  }, []);

  // Save local player settings to localStorage
  useEffect(() => {
    localStorage.setItem(config.localStoragePlayerSettingsKey, JSON.stringify(localPlayerSettings));
  }, [localPlayerSettings]);

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
          <Vote gameState={gameState} onVote={handleVoteToStartGame} />
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
        <GameHeader gameState={gameState} isLocalPlayerTurn={isLocalPlayerTurn} />
        <GameBoard
          gameState={gameState}
          bottomCard={bottomCard}
          bottomCardTrigger={bottomCardTrigger}
          localPlayerId={localPlayer.id}
        />
        <PlayerActions
          handlePlayCard={handlePlayCard}
          handleSlap={handleSlap}
          isLocalPlayerTurn={isLocalPlayerTurn}
          gameOver={gameState.gameOver}
          hotkeys={localPlayerSettings.hotkeys}
        />
        {lastAction && <GameAnimation action={lastAction} duration={0.5} />}
        <ActionLog
          gameState={gameState}
          playerActionLog={playerActionLog}
          isActionLogExpanded={false}
          toggleActionLog={function (): void {
            throw new Error('Function not implemented.');
          }}
        />
      </Paper>
    </motion.div>
  );

  const renderSettingsDrawer = () => (
    <SettingsDrawer
      localPlayerSettings={localPlayerSettings}
      handleLocalPlayerSettingsChange={setLocalPlayerSettings}
      gameSettings={gameSettings}
      allSlapRules={allSlapRules}
      handleGameSettingsChange={handleGameSettingsChange}
    />
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

  return (
    <Container size="sm" p="lg">
      {renderUI()}

      {renderSettingsDrawer()}
      {renderCustomRuleModal()}
    </Container>
  );
};
