import { io, Socket } from 'socket.io-client';
import { GameState, LobbyState, PlayerAction } from './types';

class API {
    private socket: Socket;
    private listeners: { [event: string]: Function[] } = {};

    constructor() {
        this.socket = io('http://localhost:3000');
        this.setupSocketListeners();
    }

    private setupSocketListeners() {
        this.socket.on('connect', () => this.emit('connect'));
        this.socket.on('disconnect', () => this.emit('disconnect'));
        this.socket.on('lobbyUpdate', (lobbyState: LobbyState) => this.emit('lobbyUpdate', lobbyState));
        this.socket.on('gameCreated', (gameState: GameState) => this.emit('gameCreated', gameState));
        this.socket.on('gameUpdate', (gameState: GameState) => this.emit('gameUpdate', gameState));
        this.socket.on('slapResult', (isValidSlap: boolean) => this.emit('slapResult', isValidSlap));
        this.socket.on('playerAction', (playerAction: PlayerAction) => this.emit('playerAction', playerAction));
        this.socket.on('error', (errorMessage: string) => this.emit('error', errorMessage));
        this.socket.on('gameOver', (gameState: GameState) => this.emit('gameOver', gameState));
    }

    on(event: string, callback: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    private emit(event: string, ...args: any[]) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(...args));
        }
    }

    joinLobby(playerName: string) {
        this.socket.emit('joinLobby', playerName);
    }

    createGame() {
        this.socket.emit('createGame');
    }

    joinGame(gameId: string) {
        this.socket.emit('joinGame', gameId);
    }

    playCard() {
        this.socket.emit('playCard');
    }

    slap() {
        this.socket.emit('slap');
    }

    getSocketId(): string {
        return this.socket.id || '';
    }

    removeAllListeners(event: string) {
        delete this.listeners[event];
    }

    updatePlayerName(newName: string) {
        this.socket.emit('updatePlayerName', newName);
    }

    restartGame() {
        this.socket.emit('restartGame');
    }
}

export const api = new API();