import { Component } from 'inferno';
import { ClientPlayer } from './ClientPlayer';
import { joinGame, createGame, playCard, slap } from './client';
import { Card } from './components/Card';
import { Text } from './components/Text';
import { Button } from './components/Button';
import { Alert } from './components/Alert';

export interface GameState {
    id: string;
    players: string[];
    currentPlayer: number;
    pileSize: number;
    topCard: any | null; // TODO: Define card type
    playerHandSizes: { [playerId: string]: number };
    gameOver: boolean;
}

export interface LobbyState {
    players: { id: string; name: string }[];
    games: { id: string; playerCount: number }[];
}

interface ClientGameProps {
    localPlayer: ClientPlayer;
}

interface ClientGameState {
    gameState: GameState | null;
    lobbyState: LobbyState | null;
    otherPlayers: ClientPlayer[];
    lastSlapResult: boolean | null;
    gameId: string;
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
        };
    }

    updateGameState(newState: GameState): void {
        this.setState({ gameState: newState }, () => {
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
                .filter(id => id !== this.props.localPlayer.id)
                .map(id => new ClientPlayer(id, `Player ${id.substr(0, 4)}`));
            this.setState({ otherPlayers });
        }
    }

    render() {
        const { lobbyState, gameState, otherPlayers, lastSlapResult } = this.state;
        const { localPlayer } = this.props;

        return (
            <div>
                <Button onClick={() => createGame()}>Create Game</Button>
                <TextInput placeholder="Game ID" onChange={(e) => this.setState({ gameId: e.target.value })} />
                <Button onClick={() => joinGame(this.state.gameId)}>Join Game</Button>
                {lobbyState && (
                    <div style={{ padding: '20px' }}>
                        <h2>Lobby</h2>
                        {lobbyState.players.map(player => (
                            <div>{player.name}</div>
                        ))}
                        <h3>Games</h3>
                        {lobbyState.games.map(game => (
                            <div>
                                <span>Game ID: {game.id}</span>
                                <span>Players: {game.playerCount}</span>
                                <Button onClick={() => joinGame(game.id)}>Join</Button>
                            </div>
                        ))}
                    </div>
                )}
                {gameState && (
                    <div style={{ padding: '20px' }}>
                        <Card>
                            <Group position="apart">
                                <Text>Game ID: {gameState.id}</Text>
                                <Text>Current Player: {gameState.currentPlayer}</Text>
                            </Group>
                            <Text>Pile Size: {gameState.pileSize}</Text>
                            <Text>Top Card: {JSON.stringify(gameState.topCard)}</Text>
                            <Text>Your Hand Size: {gameState.playerHandSizes[localPlayer.id] || 0}</Text>
                            <Text>Game Over: {gameState.gameOver.toString()}</Text>
                        </Card>
                        <Stack spacing="xs" style={{ marginTop: '20px' }}>
                            <Text>You: {localPlayer.name} ({gameState.playerHandSizes[localPlayer.id] || 0} cards)</Text>
                            {otherPlayers.map(player => (
                                <Text>{player.name} ({gameState.playerHandSizes[player.id] || 0} cards)</Text>
                            ))}
                        </Stack>
                        <Group position="center" style={{ marginTop: '20px' }}>
                            <Button onClick={() => playCard()}>Play Card</Button>
                            <Button color="red" onClick={() => slap()}>Slap</Button>
                        </Group>
                        {lastSlapResult !== null && (
                            <Alert
                                title={lastSlapResult ? 'Valid slap!' : 'Invalid slap!'}
                                color={lastSlapResult ? 'green' : 'red'}
                                style={{ marginTop: '20px' }}
                            >
                                {lastSlapResult ? 'You successfully slapped the pile!' : 'Oops! That was an invalid slap.'}
                            </Alert>
                        )}
                    </div>
                )}
            </div>
        );
    }
}

export default ClientGame;
