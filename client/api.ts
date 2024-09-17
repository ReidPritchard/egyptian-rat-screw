import { io, Socket } from 'socket.io-client';
import { Card, GameState, LobbyState, PlayerAction, SlapRule } from './types';

class Api {
  socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000', { path: '/socket.io' });
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

  updatePlayerName(newName: string) {
    this.socket.emit('updatePlayerName', newName);
  }

  restartGame() {
    this.socket.emit('restartGame');
  }

  updateGameSettings(gameId: string, settings: { maxPlayers?: number; slapRules?: SlapRule[] }) {
    this.socket.emit('updateGameSettings', gameId, settings);
  }

  leaveGame() {
    this.socket.emit('leaveGame');
  }

  on(event: 'connect', callback: () => void): void;
  on(event: 'disconnect', callback: () => void): void;
  on(event: 'lobbyUpdate', callback: (lobbyState: LobbyState) => void): void;
  on(event: 'gameCreated' | 'gameUpdate', callback: (gameState: GameState) => void): void;
  on(event: 'slapResult', callback: (isValidSlap: boolean) => void): void;
  on(event: 'gameOver', callback: (gameState: GameState) => void): void;
  on(event: 'error', callback: (errorMessage: string) => void): void;
  on(event: 'playerAction', callback: (action: PlayerAction) => void): void;
  on(event: 'gameSettings', callback: (slapRules: SlapRule[]) => void): void;

  on(event: string, callback: (...args: any[]) => void): void {
    this.socket.on(event, callback);
  }

  removeAllListeners(event: 'connect'): void;
  removeAllListeners(event: 'disconnect'): void;
  removeAllListeners(event: string): void {
    this.socket.removeAllListeners(event);
  }
}

export const api = new Api();
