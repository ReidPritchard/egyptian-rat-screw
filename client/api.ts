import { io, Socket } from 'socket.io-client';
import { config } from './config';
import {
  ChangeNamePayload,
  CreateGamePayload,
  JoinGamePayload,
  LeaveGamePayload,
  PlayCardPayload,
  SlapPilePayload,
  SocketEvents,
} from './socketEvents';
import { GameSettings, PlayerAction, PlayerInfo } from './types';

class Api {
  private _socket: Socket | null = null;

  get socket(): Socket {
    if (!this._socket) {
      this._socket = io(config.serverUrl, { path: '/socket.io' });
    }
    return this._socket;
  }

  changeName(payload: ChangeNamePayload) {
    this.socket.emit(SocketEvents.CHANGE_NAME, payload);
  }

  joinGame(payload: JoinGamePayload) {
    this.socket.emit(SocketEvents.JOIN_GAME, payload);
  }

  createGame(payload: CreateGamePayload) {
    this.socket.emit(SocketEvents.CREATE_GAME, payload);
  }

  leaveGame(payload: LeaveGamePayload) {
    this.socket.emit(SocketEvents.LEAVE_GAME, payload);
  }

  playCard(payload: PlayCardPayload) {
    this.socket.emit(SocketEvents.PLAY_CARD, payload);
  }

  slapPile(payload: Partial<SlapPilePayload>) {
    if (!payload.playerId) {
      throw new Error('playerId is required');
    }

    this.socket.emit(SocketEvents.SLAP_PILE, payload);
  }

  playerReady(payload: PlayerInfo) {
    this.socket.emit(SocketEvents.PLAYER_READY, payload);
  }

  playerAction(action: PlayerAction) {
    this.socket.emit(SocketEvents.PLAYER_ACTION, action);
  }

  setGameSettings(gameId: string, settings: GameSettings) {
    this.socket.emit(SocketEvents.SET_GAME_SETTINGS, { gameId, settings });
  }

  startVote(topic: string) {
    this.socket.emit(SocketEvents.VOTE_STARTED, { topic });
  }

  submitVote(vote: boolean) {
    this.socket.emit(SocketEvents.VOTE_UPDATED, { vote });
  }

  on(event: SocketEvents, callback: (...args: any[]) => void): void {
    this.socket.on(event, callback);
  }

  off(event: SocketEvents, callback?: (...args: any[]) => void): void {
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }
}

export const api = new Api();
