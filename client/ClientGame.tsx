import React, { Component } from 'react';
import { api } from './api';
import { Container, Group, TextInput, Paper, Title, Tabs, ActionIcon, Tooltip, Stack, Space } from '@mantine/core';
import { GameState, LobbyState, ClientGameState, PlayerAction, Card, SlapRule } from './types';
import { motion } from 'framer-motion';
import { ErrorMessages } from './components/ErrorMessages';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconLogin } from '@tabler/icons-react';

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
      playerName: localStorage.getItem('playerName') || props.localPlayer.name,
      errorMessages: [],
      playerActionLog: [],
      isActionLogExpanded: true,
      bottomCard: null,
      bottomCardTimer: null,
      activeTab: 'lobby',
    };
    this.setupApiListeners();
  }

  componentDidMount() {
    api.joinLobby(this.props.localPlayer.name);
    this.setupNotifications();
  }

  setupApiListeners() {
    api.on('lobbyUpdate', (lobbyState: LobbyState) => this.updateLobbyState(lobbyState));
    api.on('gameCreated', (gameState: GameState) => this.updateGameState(gameState));
    api.on('gameUpdate', (gameState: GameState) => this.updateGameState(gameState));
    api.on('slapResult', (isValidSlap: boolean) => this.updateSlapResult(isValidSlap));
    api.on('gameOver', (gameState: GameState) => this.updateGameState(gameState));
    api.on('error', (errorMessage: string) => this.handleError(errorMessage));
    api.on('playerAction', (action: PlayerAction) => this.handlePlayerAction(action));
    api.on('gameSettings', (slapRules: SlapRule[]) => this.handleGameSettings(slapRules));
  }

  setupNotifications() {
    api.on('gameUpdate', (gameState: GameState) => {
      if (
        gameState.maxPlayers !== this.state.gameState?.maxPlayers ||
        gameState.slapRules !== this.state.gameState?.slapRules
      ) {
        this.showNotification('Game settings updated successfully!');
      }
    });
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

    this.setState(
      (prevState) => {
        if (prevState.bottomCardTimer) {
          clearTimeout(prevState.bottomCardTimer);
        }
        return {
          gameState: newState,
          bottomCard: null,
          bottomCardTimer: null,
        };
      },
      () => {
        this.updatePlayers();
      },
    );
  }

  handleGameSettings(slapRules: SlapRule[]) {
    this.setState({ allSlapRules: slapRules });
  }

  updateLobbyState(newState: LobbyState): void {
    this.setState({ lobbyState: newState });
  }

  updateSlapResult(isValidSlap: boolean): void {
    this.setState({ lastSlapResult: isValidSlap });
  }

  private updatePlayers(): void {
    if (this.state.gameState) {
      const otherPlayers = this.state.gameState.players.filter((player) => player.id !== this.props.localPlayer.id);
      this.setState({ otherPlayers });
    }
  }

  handleCreateGame = () => {
    api.createGame();
    this.setState({ activeTab: 'game' });
  };

  handleJoinGame = (gameId: string) => {
    api.joinGame(gameId);
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

  handleRestartGame = () => {
    api.restartGame();
  };

  dismissError = (index: number) => {
    this.setState((prevState) => ({
      errorMessages: prevState.errorMessages.filter((_, i) => i !== index),
    }));
  };

  handlePlayerAction(action: PlayerAction) {
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
      const BOTTOM_CARD_DISPLAY_DURATION = 3000;

      const newTimer = setTimeout(() => {
        this.setState({ bottomCard: null, bottomCardTimer: null });
      }, BOTTOM_CARD_DISPLAY_DURATION);

      this.setState({
        bottomCard: bottomCard,
        bottomCardTimer: newTimer,
      });
    }
  }

  toggleActionLog = () => {
    this.setState((prevState) => ({ isActionLogExpanded: !prevState.isActionLogExpanded }));
  };

  handleMaxPlayersChange = (value: string | undefined) => {
    if (value && this.state.gameState) {
      const maxPlayers = parseInt(value, 10);
      if (!isNaN(maxPlayers) && maxPlayers >= 2 && maxPlayers <= 8) {
        api.updateGameSettings(this.state.gameState.id, { maxPlayers });
      }
    }
  };

  handleSlapRuleChange = (selectedRules: SlapRule[]) => {
    if (this.state.gameState) {
      api.updateGameSettings(this.state.gameState.id, { slapRules: selectedRules });
    }
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
                localPlayer={this.props.localPlayer}
                otherPlayers={this.state.otherPlayers}
                lastSlapResult={this.state.lastSlapResult}
                bottomCard={this.state.bottomCard}
                playerActionLog={this.state.playerActionLog}
                isActionLogExpanded={this.state.isActionLogExpanded}
                handlePlayCard={this.handlePlayCard}
                handleSlap={this.handleSlap}
                handleRestartGame={this.handleRestartGame}
                handleMaxPlayersChange={this.handleMaxPlayersChange}
                handleSlapRuleChange={this.handleSlapRuleChange}
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
