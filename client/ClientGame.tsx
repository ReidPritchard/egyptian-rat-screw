import React, { Component } from 'react';
import { api } from './api';
import { Container, Group, TextInput, Paper, Title, Tabs, ActionIcon, Tooltip, Stack, Space } from '@mantine/core';
import {
  LobbyState,
  PlayerAction,
  Card,
  SlapRule,
  PlayerInfo,
  PlayerActionResult,
  GameSettings,
  VoteState,
} from './types';
import { motion } from 'framer-motion';
import { ErrorMessages } from './components/ErrorMessages';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconLogin } from '@tabler/icons-react';
import { SocketEvents } from './socketEvents';
import { GameState } from './types';
import { config } from './config';

export type Tab = 'lobby' | 'game';

export interface ClientGameState {
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
  bottomCard: Card | null;
  bottomCardTimer: NodeJS.Timeout | null;
}

interface ClientGameProps {
  localPlayer: { id: string; name: string };
}

export class ClientGame extends Component<ClientGameProps, ClientGameState> {
  constructor(props: ClientGameProps) {
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
      bottomCard: null,
      bottomCardTimer: null,
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
    api.socket.on(SocketEvents.PLAYER_ACTION_RESULT, (result: PlayerActionResult) => this.handlePlayerAction(result));
    api.socket.on(SocketEvents.SET_GAME_SETTINGS, (slapRules: SlapRule[]) => this.handleGameSettings(slapRules));
    api.socket.on(SocketEvents.ERROR, (errorMessage: string) => this.handleError(errorMessage));
    api.socket.on(SocketEvents.GET_GAME_SETTINGS, (slapRules: SlapRule[]) => this.handleGameSettings(slapRules));
    api.socket.on(SocketEvents.VOTE_UPDATE, (voteState: VoteState) => this.handleVoteUpdate(voteState));
  }

  showNotification(message: string) {
    notifications.show({
      title: 'Success',
      message,
      color: 'green',
    });
  }

  handleError(errorMessage: string) {
    console.error('Error:', errorMessage);
    this.setState((prevState) => ({
      errorMessages: [...prevState.errorMessages, errorMessage],
    }));
  }

  updateGameState(newState: GameState): void {
    console.log('updateGameState', newState);

    this.setState((prevState) => {
      if (prevState.bottomCardTimer) {
        clearTimeout(prevState.bottomCardTimer);
      }
      return {
        gameState: newState,
        bottomCard: null,
        bottomCardTimer: null,
      };
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

    if (action.actionType === 'invalidSlap') {
      this.showBottomCard();
    }
  }

  showBottomCard() {
    const { gameState, bottomCardTimer } = this.state;

    if (bottomCardTimer) {
      clearTimeout(bottomCardTimer);
    }

    if (gameState && gameState.pile && gameState.pile.length > 0) {
      const bottomCard = gameState.pile[gameState.pile.length - 1];

      const newTimer = setTimeout(() => {
        this.setState({ bottomCard: null, bottomCardTimer: null });
      }, config.game.bottomCardDisplayDuration);

      this.setState({
        bottomCard: bottomCard,
        bottomCardTimer: newTimer,
      });
    }
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
      bottomCard: null,
      bottomCardTimer: null,
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
              <Group>
                <TextInput
                  placeholder="Your Name"
                  value={playerName}
                  onChange={this.handleNameChange}
                  style={{ flex: 1 }}
                />
                <Tooltip label="Create Game">
                  <ActionIcon color="blue" onClick={this.handleCreateGame} variant="filled" disabled={!playerName}>
                    <IconPlus size="1.1rem" />
                  </ActionIcon>
                </Tooltip>
              </Group>
              <Group>
                <TextInput
                  placeholder="Game ID to Join"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => this.setState({ gameId: e.target.value })}
                  value={this.state.gameId}
                  style={{ flex: 1 }}
                />
                <Tooltip label="Join Game">
                  <ActionIcon
                    color="green"
                    onClick={() => this.handleJoinGame(this.state.gameId)}
                    variant="filled"
                    disabled={!playerName}
                  >
                    <IconLogin size="1.1rem" />
                  </ActionIcon>
                </Tooltip>
              </Group>
              {lobbyState && <Lobby lobbyState={lobbyState} handleJoinGame={this.handleJoinGame} />}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="game">
            {gameState && (
              <Game
                gameState={gameState}
                allSlapRules={this.state.allSlapRules}
                gameSettings={gameState.gameSettings}
                localPlayer={this.props.localPlayer}
                otherPlayers={this.state.otherPlayers}
                lastSlapResult={this.state.lastSlapResult}
                bottomCard={this.state.bottomCard}
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
      </Container>
    );
  }
}

export default ClientGame;
