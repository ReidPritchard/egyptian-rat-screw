import { render } from 'inferno';
import { Socket, io } from 'socket.io-client';
import { ClientPlayer } from './ClientPlayer';
import { ClientGame, GameState, LobbyState } from './ClientGame';

const socket: Socket = io('http://localhost:3000');

let localPlayer: ClientPlayer;
let game: ClientGame;

socket.on('connect', () => {
    console.log('Connected to server');
    localPlayer = new ClientPlayer(`${socket.id}`, '');
    game = new ClientGame(localPlayer);
    updateUI();
});

socket.on('lobbyUpdate', (lobbyState: LobbyState) => {
    game.updateLobbyState(lobbyState);
    updateUI();
});

socket.on('gameCreated', (gameState: GameState) => {
    game.updateGameState(gameState);
    updateUI();
});

socket.on('gameUpdate', (gameState: GameState) => {
    game.updateGameState(gameState);
    updateUI();
});

socket.on('slapResult', (isValidSlap: boolean) => {
    game.updateSlapResult(isValidSlap);
    updateUI();
});

socket.on('error', (errorMessage: string) => {
    console.error('Server error:', errorMessage);
    // TODO: Display error message to user
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    // TODO: Handle disconnection (e.g., show reconnect button)
});

function joinLobby() {
    const playerNameInput = document.getElementById('playerName') as HTMLInputElement;
    const playerName = playerNameInput.value.trim();
    if (playerName) {
        localPlayer.name = playerName;
        socket.emit('joinLobby', playerName);
    }
}

function createGame() {
    socket.emit('createGame');
}

function joinGame(gameId: string) {
    socket.emit('joinGame', gameId);
}

function playCard() {
    socket.emit('playCard');
}

function slap() {
    socket.emit('slap');
}

function updateUI() {
    render(<ClientGame localPlayer={localPlayer} />, document.getElementById('app'));
}

// Add event listeners to UI elements
document.getElementById('joinLobby')?.addEventListener('click', joinLobby);
document.getElementById('createGame')?.addEventListener('click', createGame);

// Render the initial UI
updateUI();

export {
    joinLobby,
    createGame,
    joinGame,
    playCard,
    slap,
    updateUI
};
