import React, { Component } from 'react';
import { api } from './api';
import { Text, Button, Alert, Group, Stack, TextInput, Box, Container, Title, Paper, Tooltip, Transition, Notification, Collapse } from '@mantine/core';
import { GameState, LobbyState, ClientGameState, Card, PlayerAction } from './types';
import { PlayingCard } from './PlayingCard';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'tabler-icons-react';

const BOTTOM_CARD_DISPLAY_DURATION = 3000; // 3 seconds

interface ClientGameProps {
    localPlayer: { id: string; name: string };
}

export class ClientGame extends Component<ClientGameProps, ClientGameState> {
    constructor(props: ClientGameProps) {
        super(props);
        this.state = {
            gameState: null,
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
        };
        this.setupApiListeners();
    }

    componentDidMount() {
        api.joinLobby(this.props.localPlayer.name);
    }

    setupApiListeners() {
        api.on('lobbyUpdate', (lobbyState: LobbyState) => this.updateLobbyState(lobbyState));
        api.on('gameCreated', (gameState: GameState) => this.updateGameState(gameState));
        api.on('gameUpdate', (gameState: GameState) => this.updateGameState(gameState));
        api.on('slapResult', (isValidSlap: boolean) => this.updateSlapResult(isValidSlap));
        api.on('gameOver', (gameState: GameState) => this.updateGameState(gameState));
        api.on('error', (errorMessage: string) => this.handleError(errorMessage));
        api.on('playerAction', (action: PlayerAction) => this.handlePlayerAction(action));
    }

    handleError(errorMessage: string) {
        console.error('Error:', errorMessage);
        this.setState({ errorMessages: [...this.state.errorMessages, errorMessage] });
    }

    updateGameState(newState: GameState): void {
        console.log("updateGameState", newState);

        this.setState(prevState => {
            if (prevState.bottomCardTimer) {
                clearTimeout(prevState.bottomCardTimer);
            }
            return {
                gameState: newState,
                bottomCard: null,
                bottomCardTimer: null,
            };
        }, () => {
            this.updatePlayers();
        });
    }

    updateLobbyState(newState: LobbyState): void {
        this.setState({ lobbyState: newState });
    }

    updateSlapResult(isValidSlap: boolean): void {
        this.setState({ lastSlapResult: isValidSlap });
    }

    private updatePlayers(): void {
        if (this.state.gameState) {
            const otherPlayers = this.state.gameState.players
                .filter(player => player.id !== this.props.localPlayer.id)
            this.setState({ otherPlayers });
        }
    }

    handleCreateGame = () => {
        api.createGame();
    }

    handleJoinGame = (gameId: string) => {
        api.joinGame(gameId);
    }

    handlePlayCard = () => {
        api.playCard();
    }

    handleSlap = () => {
        api.slap();
    }

    handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newName = event.target.value;
        this.setState({ playerName: newName });
        api.updatePlayerName(newName);
    }

    handleRestartGame = () => {
        api.restartGame();
    }

    dismissError(index: number) {
        this.setState({ errorMessages: this.state.errorMessages.filter((_, i) => i !== index) });
    }

    handlePlayerAction(action: PlayerAction) {
        this.setState(prevState => ({
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
            }, BOTTOM_CARD_DISPLAY_DURATION);

            this.setState({
                bottomCard: bottomCard,
                bottomCardTimer: newTimer,
            });
        }
    }

    toggleActionLog = () => {
        this.setState(prevState => ({ isActionLogExpanded: !prevState.isActionLogExpanded }));
    }

    renderActionLog() {
        const { playerActionLog, isActionLogExpanded } = this.state;

        return (
            <Paper withBorder p="md" mt="md">
                <Group position="apart" mb="xs">
                    <Title order={4}>Action Log</Title>
                    <Button
                        variant="subtle"
                        onClick={this.toggleActionLog}
                        rightIcon={isActionLogExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    >
                        {isActionLogExpanded ? "Hide" : "Show"}
                    </Button>
                </Group>
                <Collapse in={isActionLogExpanded}>
                    <Stack spacing="xs">
                        {playerActionLog.slice(0, 10).map((action, index) => {
                            const playerName = this.getPlayerName(action.playerId);
                            let message = '';
                            let color = 'blue';

                            switch (action.actionType) {
                                case 'playCard':
                                    message = `${playerName} played a card`;
                                    break;
                                case 'slap':
                                    message = `${playerName} slapped the pile`;
                                    color = 'green';
                                    break;
                                case 'invalidSlap':
                                    message = `${playerName} made an invalid slap`;
                                    color = 'red';
                                    break;
                            }
                            return (
                                <Group spacing="xs" noWrap>
                                    <Text size="xs" color="dimmed">
                                        {new Date(action.timestamp).toLocaleTimeString()}
                                    </Text>
                                    <Text key={index} color={color} size="sm">
                                        {message}
                                    </Text>
                                </Group>
                            );
                        })}
                    </Stack>
                </Collapse>
            </Paper>
        );
    }

    getPlayerName(playerId: string): string {
        const { gameState } = this.state;
        const { localPlayer } = this.props;

        if (playerId === localPlayer.id) {
            return 'You';
        }

        const player = gameState?.players.find(p => p.id === playerId);
        return player ? player.name : 'Unknown Player';
    }

    renderCardStack() {
        const { gameState } = this.state;
        if (!gameState || !gameState.pile) return null;

        return (
            <Box sx={{ position: 'relative', width: '60px', height: '90px' }}>
                <AnimatePresence>
                    {gameState.pile.map((card, index, array) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: -50 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                rotate: (index * 10) % 360,
                                zIndex: array.length - index,
                            }}
                            exit={{ opacity: 0, y: -50 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                position: 'absolute',
                                width: '60px',
                                height: '90px',
                            }}
                        >
                            <PlayingCard suit={card.suit} value={card.rank} faceUp={true} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </Box>
        );
    }

    renderErrorMessages() {
        const { errorMessages } = this.state;
        if (errorMessages.length === 0) return null;

        return (
            <Transition mounted={errorMessages.length > 0} transition="fade" duration={400} timingFunction="ease">
                {(styles) => (
                    <Alert
                        title="Error"
                        color="red"
                        onClose={() => this.dismissError(0)}
                        style={{ ...styles, marginBottom: '20px' }}
                    >
                        {errorMessages[0]}
                    </Alert>
                )}
            </Transition>
        );
    }

    renderLobby() {
        const { lobbyState } = this.state;
        if (!lobbyState) return null;

        return (
            <Container>
                <Title order={2}>Lobby</Title>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Paper style={{ marginTop: '20px', padding: '10px' }}>
                        <Title order={3}>Players</Title>
                        <AnimatePresence>
                            {lobbyState.players.map(player => (
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
                        <Stack spacing="xs">
                            <AnimatePresence>
                                {lobbyState.games.map(game => (
                                    <motion.div
                                        key={game.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Paper withBorder>
                                            <Group position="apart">
                                                <div>
                                                    <Text size="lg">{game.name}</Text>
                                                    <Text size="xs">ID: {game.id}</Text>
                                                    <Text size="xs">Players: {game.playerCount}/{game.maxPlayers}</Text>
                                                </div>
                                                <Button onClick={() => this.handleJoinGame(game.id)}>Join</Button>
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
    }

    renderBottomCard() {
        const { bottomCard } = this.state;

        if (!bottomCard) return null;

        return (
            <Transition mounted={!!bottomCard} transition="fade" duration={300} timingFunction="ease">
                {(styles) => (
                    <Box style={{ ...styles, position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)' }}>
                        <Text align="center" mb="xs">Bottom card (invalid slap):</Text>
                        <PlayingCard suit={bottomCard.suit} value={bottomCard.rank} faceUp={true} />
                    </Box>
                )}
            </Transition>
        );
    }

    renderGame() {
        const { gameState, otherPlayers, lastSlapResult } = this.state;
        const { localPlayer } = this.props;
        if (!gameState) return null;

        return (
            <Container>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Group position="apart">
                        <Text>Game: {gameState.name}</Text>
                        <Text>Current Player: {gameState.players[gameState.currentPlayer].name}</Text>
                    </Group>
                    <Text>Pile Size: {gameState.pileSize}</Text>
                    <Group position="center" style={{ marginTop: '20px', marginBottom: '20px' }}>
                        {this.renderBottomCard()}
                        {this.renderCardStack()}
                    </Group>
                    <Stack spacing="xs" style={{ marginTop: '20px' }}>
                        <Text
                            style={{
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                color: 'blue',
                            }}
                        >You: {localPlayer.name} ({gameState.playerHandSizes[localPlayer.id] || 0})</Text>
                        <AnimatePresence>
                            {otherPlayers.map(player => (
                                <motion.div
                                    key={player.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Text>
                                        {player.name} ({gameState.playerHandSizes[player.id] || 0})
                                        {gameState.currentPlayer === gameState.players.findIndex(p => p.id === player.id) && (
                                            <span style={{ marginLeft: '10px', color: 'green' }}>🔄 Current Turn</span>
                                        )}
                                    </Text>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </Stack>
                    <Group position="center" style={{ marginTop: '20px' }}>
                        <Tooltip label="Play a card from your hand">
                            <Button
                                onClick={this.handlePlayCard}
                                disabled={gameState.gameOver || gameState.players[gameState.currentPlayer].id !== localPlayer.id}
                            >
                                Play Card
                            </Button>
                        </Tooltip>
                        <Tooltip label="Slap the pile if you think it's a valid slap">
                            <Button color="red" onClick={this.handleSlap} disabled={gameState.gameOver}>Slap</Button>
                        </Tooltip>
                        {gameState.gameOver && (
                            <Button onClick={this.handleRestartGame}>Restart Game</Button>
                        )}
                    </Group>
                    {this.renderActionLog()}
                </motion.div>
                {this.renderSlapResult(lastSlapResult)}
                {this.renderGameOver(gameState)}
            </Container>
        );
    }

    renderSlapResult(lastSlapResult: boolean | null) {
        if (lastSlapResult === null) return null;

        return (
            <Transition mounted={lastSlapResult !== null} transition="slide-up" duration={400} timingFunction="ease">
                {(styles) => (
                    <Alert
                        title={lastSlapResult ? 'Valid slap!' : 'Invalid slap!'}
                        color={lastSlapResult ? 'green' : 'red'}
                        style={{ ...styles, marginTop: '20px' }}
                    >
                        {lastSlapResult ? 'You successfully slapped the pile!' : 'Oops! That was an invalid slap.'}
                    </Alert>
                )}
            </Transition>
        );
    }

    renderGameOver(gameState: GameState) {
        if (!gameState.gameOver) return null;

        return (
            <Transition mounted={gameState.gameOver} transition="slide-up" duration={400} timingFunction="ease">
                {(styles) => (
                    <Alert
                        title="Game Over!"
                        color="blue"
                        style={{ ...styles, marginTop: '20px' }}
                    >
                        {gameState.winner && gameState.winner.id === this.props.localPlayer.id
                            ? 'Congratulations! You won the game!'
                            : `${gameState.winner!.name} wins!`}
                    </Alert>
                )}
            </Transition>
        );
    }

    render() {
        const { lobbyState, gameState, playerName } = this.state;

        return (
            <Container>
                {this.renderErrorMessages()}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Group position="apart" style={{ marginBottom: '20px' }}>
                        <TextInput
                            placeholder="Your Name"
                            value={playerName}
                            onChange={this.handleNameChange}
                            style={{ width: '200px' }}
                        />
                        <Button onClick={this.handleCreateGame}>Create Game</Button>
                        <TextInput
                            placeholder="Game ID to Join"
                            onChange={(e) => this.setState({ gameId: e.target.value })}
                            value={this.state.gameId}
                        />
                        <Button onClick={() => this.handleJoinGame(this.state.gameId)}>Join Game</Button>
                    </Group>
                </motion.div>
                {lobbyState && !gameState && this.renderLobby()}
                {gameState && this.renderGame()}
            </Container>
        );
    }
}

export default ClientGame;
