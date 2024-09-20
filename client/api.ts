import { io, Socket } from 'socket.io-client';
import { GameSettings, PlayerInfo, PlayerActionType } from './types';
import { SocketEvents } from './socketEvents';
import { config } from './config';

class Api {
  socket: Socket;

  constructor() {
    this.socket = io(config.serverUrl, { path: '/socket.io' });
  }

  setPlayerName(playerName: string) {
    this.socket.emit(SocketEvents.SET_PLAYER_NAME, playerName);
  }

  joinGame(gameId: string, playerName: string) {
    this.setPlayerName(playerName);
    this.socket.emit(SocketEvents.JOIN_GAME, gameId);
  }

  voteToStartGame(vote: boolean) {
    this.socket.emit(SocketEvents.GAME_VOTE, vote);
  }

  playCard() {
    this.socket.emit(SocketEvents.PLAYER_PLAY_CARD);
  }

  slap() {
    this.socket.emit(SocketEvents.PLAYER_ACTION, PlayerActionType.SLAP);
  }

  updatePlayerName(newName: string) {
    this.socket.emit(SocketEvents.SET_PLAYER_NAME, newName);
  }

  getGameSettings(gameId: string) {
    this.socket.emit(SocketEvents.GET_GAME_SETTINGS, gameId);
  }

  setGameSettings(gameId: string, settings: GameSettings) {
    this.socket.emit(SocketEvents.SET_GAME_SETTINGS, gameId, settings);
  }

  leaveGame() {
    this.socket.emit(SocketEvents.LEAVE_GAME);
  }

  on(event: SocketEvents, callback: (...args: any[]) => void): void {
    this.socket.on(event, callback);
  }

  removeAllListeners(event: 'connect'): void;
  removeAllListeners(event: 'disconnect'): void;

  removeAllListeners(event: string): void {
    this.socket.removeAllListeners(event);
  }
}

export const api = new Api();
