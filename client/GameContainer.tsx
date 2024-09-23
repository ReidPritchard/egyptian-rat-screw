import {
  ActionIcon,
  Button,
  Container,
  Group,
  Paper,
  Space,
  Stack,
  Tabs,
  TextInput,
  Title,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useColorScheme } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconLogin, IconMoon, IconPlus, IconSun } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import React, { Component } from 'react';
import { api } from './api';
import { ErrorMessages } from './components/ErrorMessages';
import { Game } from './components/Game';
import { Lobby } from './components/Lobby';
import { config } from './config';
import { SocketEvents } from './socketEvents';
import {
  Card,
  GameSettings,
  GameState,
  LobbyState,
  PlayerAction,
  PlayerActionResult,
  PlayerInfo,
  SlapRule,
  VoteState,
} from './types';

export type Tab = 'lobby' | 'game';

export interface GameContainerState {
  gameState: GameState | null;
  allSlapRules: SlapRule[];
  lobbyState: LobbyState | null;
  otherPlayers: PlayerInfo[];
  lastSlapResult: boolean | null;
  gameId: string;
  animatingCardId: string | null;
  playerName: string;
  errorMessages: string[];
  activeTab: Tab;
  playerActionLog: (PlayerAction | PlayerActionResult)[];
  isActionLogExpanded: boolean;
}

interface GameContainerProps {
  localPlayer: { id: string; name: string };
}

export class GameContainer extends Component<GameContainerProps, GameContainerState> {
  constructor(props: GameContainerProps) {
    super(props);
    this.state = {
      gameState: null,
      allSlapRules: [],
      lobbyState: null,
      otherPlayers: [],
      lastSlapResult: null,
      gameId: '',
      animatingCardId: null,
      playerName: props.localPlayer.name,
      errorMessages: [],
      playerActionLog: [],
      isActionLogExpanded: true,
      activeTab: 'lobby',
    };
  }

  componentDidMount() {
    this.setupApiListeners();
  }

  setupApiListeners() {
    api.socket.on(SocketEvents.LOBBY_UPDATE, (lobbyState: LobbyState) => this.updateLobbyState(lobbyState));
    api.socket.on(SocketEvents.GAME_UPDATE, (gameState: GameState) => this.updateGameState(gameState));
    api.socket.on(SocketEvents.PLAYER_ACTION, (action: PlayerAction) => this.handlePlayerAction(action));
    api.socket.on(SocketEvents.PLAYER_ACTION_RESULT, (result: PlayerActionResult) =>
      this.handlePlayerActionResult(result),
    );
    api.socket.on(SocketEvents.SET_GAME_SETTINGS, (slapRules: SlapRule[]) => this.handleGameSettings(slapRules));
    api.socket.on(SocketEvents.ERROR, (errorMessage: string) => this.handleError(errorMessage));
    api.socket.on(SocketEvents.GET_GAME_SETTINGS, (slapRules: SlapRule[]) => this.handleGameSettings(slapRules));
    api.socket.on(SocketEvents.VOTE_UPDATE, (voteState: VoteState) => this.handleVoteUpdate(voteState));
  }

  handlePlayerActionResult(result: PlayerActionResult) {
    this.showNotification(result.message, result.result === 'success' ? 'green' : 'red');
    this.setState((prevState) => ({
      playerActionLog: [...prevState.playerActionLog, result].sort((a, b) => b.timestamp - a.timestamp),
    }));
  }

  showNotification(message: string, color: string) {
    notifications.show({
      title: 'Game Update',
      message,
      color,
    });
  }

  handleError(errorMessage: string) {
    console.error('Error:', errorMessage);
    this.showNotification(errorMessage, 'red');
    this.setState((prevState) => ({
      errorMessages: [...prevState.errorMessages, errorMessage],
    }));
  }

  updateGameState(newState: GameState): void {
    console.log('updateGameState', newState);

    this.setState({
      gameState: newState,
    });
  }

  handleGameSettings(slapRules: SlapRule[]) {
    this.setState({ allSlapRules: slapRules });
  }

  updateLobbyState(newState: LobbyState): void {
    this.setState({ lobbyState: newState });
  }

  handleCreateGame = () => {
    // To create a game, we just join a game with an empty id
    this.handleJoinGame('');
  };

  handleJoinGame = (gameId: string) => {
    api.joinGame(gameId, this.state.playerName);
    this.setState({ activeTab: 'game' });
  };

  handlePlayCard = () => {
    api.playCard();
  };

  handleSlap = () => {
    api.slap();
  };

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    this.setState({ playerName: newName });
    api.updatePlayerName(newName);
    localStorage.setItem('playerName', newName);
  };

  dismissError = (index: number) => {
    this.setState((prevState) => ({
      errorMessages: prevState.errorMessages.filter((_, i) => i !== index),
    }));
  };

  handlePlayerAction(action: PlayerAction | PlayerActionResult) {
    console.log('handlePlayerAction', action);
    this.setState((prevState) => ({
      playerActionLog: [action, ...prevState.playerActionLog],
    }));
  }

  toggleActionLog = () => {
    this.setState((prevState) => ({ isActionLogExpanded: !prevState.isActionLogExpanded }));
  };

  handleGameSettingsChange = (settings: GameSettings) => {
    api.setGameSettings(this.state.gameId, settings);
  };

  handleVoteToStartGame = (vote: boolean) => {
    api.submitVote(vote);
  };

  handleLeaveGame = () => {
    api.leaveGame();
    this.setState({
      gameState: null,
      otherPlayers: [],
      lastSlapResult: null,
      playerActionLog: [],
      activeTab: 'lobby',
    });
  };

  handleVoteUpdate(voteState: VoteState) {
    this.setState((prevState) => ({
      gameState: prevState.gameState ? { ...prevState.gameState, voteState } : null,
    }));
  }

  render() {
    const { lobbyState, gameState, playerName } = this.state;

    return (
      <Container size="sm" p="md">
        <Title order={1} mb="md">
          Egyptian Rat Screw
        </Title>
        <Tabs
          defaultValue="lobby"
          value={this.state.activeTab}
          onChange={(value) => this.setState({ activeTab: value as 'lobby' | 'game' })}
        >
          <Tabs.List>
            <Tabs.Tab value="lobby">Lobby</Tabs.Tab>
            <Tabs.Tab value="game" disabled={!gameState}>
              Game
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="lobby">
            <Stack gap="md" mt="lg">
              <Lobby
                lobbyState={lobbyState}
                handleJoinGame={this.handleJoinGame}
                handleCreateGame={this.handleCreateGame}
                localPlayer={this.props.localPlayer}
                playerName={playerName}
                handleNameChange={this.handleNameChange}
              />
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="game">
            {gameState && (
              <Game
                gameState={gameState}
                allSlapRules={this.state.allSlapRules}
                gameSettings={gameState.gameSettings}
                localPlayer={this.props.localPlayer}
                lastSlapResult={this.state.lastSlapResult}
                playerActionLog={this.state.playerActionLog}
                isActionLogExpanded={this.state.isActionLogExpanded}
                handlePlayCard={this.handlePlayCard}
                handleSlap={this.handleSlap}
                handleVoteToStartGame={this.handleVoteToStartGame}
                handleGameSettingsChange={this.handleGameSettingsChange}
                toggleActionLog={this.toggleActionLog}
                handleLeaveGame={this.handleLeaveGame}
              />
            )}
          </Tabs.Panel>
        </Tabs>
        <ThemeToggle />
      </Container>
    );
  }
}

const ThemeToggle: React.FC = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <Button
      variant="outline"
      color={colorScheme === 'dark' ? 'yellow' : 'blue'}
      onClick={() => toggleColorScheme()}
      style={{ position: 'fixed', bottom: 20, right: 20 }}
    >
      {colorScheme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
    </Button>
  );
};

export default GameContainer;
