import { io, Socket } from 'socket.io-client';
import { config } from './config';
import { newLogger } from './logger';
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
  private logger = newLogger('api');

  get socket(): Socket {
    if (!this._socket) {
      this._socket = io(config.serverUrl, { path: '/socket.io' });
      this.logger.info('Socket connection initialized');
    }
    return this._socket;
  }

  changeName(payload: ChangeNamePayload) {
    this.logger.info('Emitting CHANGE_NAME event', payload);
    this.socket.emit(SocketEvents.CHANGE_NAME, payload);
  }

  joinGame(payload: JoinGamePayload) {
    this.logger.info('Emitting JOIN_GAME event', payload);
    this.socket.emit(SocketEvents.JOIN_GAME, payload);
  }

  createGame(payload: CreateGamePayload) {
    this.logger.info('Emitting CREATE_GAME event', payload);
    this.socket.emit(SocketEvents.CREATE_GAME, payload);
  }

  leaveGame(payload: LeaveGamePayload) {
    this.logger.info('Emitting LEAVE_GAME event', payload);
    this.socket.emit(SocketEvents.LEAVE_GAME, payload);
  }

  playCard(payload: PlayCardPayload) {
    this.logger.info('Emitting PLAY_CARD event', payload);
    this.socket.emit(SocketEvents.PLAY_CARD, payload);
  }

  slapPile(payload: Partial<SlapPilePayload>) {
    if (!payload.playerId) {
      throw new Error('playerId is required');
    }

    this.logger.info('Emitting SLAP_PILE event', payload);
    this.socket.emit(SocketEvents.SLAP_PILE, payload);
  }

  playerReady(payload: PlayerInfo) {
    this.logger.info('Emitting PLAYER_READY event', payload);
    this.socket.emit(SocketEvents.PLAYER_READY, payload);
  }

  playerAction(action: PlayerAction) {
    this.logger.info('Emitting PLAYER_ACTION event', action);
    this.socket.emit(SocketEvents.PLAYER_ACTION, action);
  }

  setGameSettings(gameId: string, settings: GameSettings) {
    this.logger.info('Emitting SET_GAME_SETTINGS event', { gameId, settings });
    this.socket.emit(SocketEvents.SET_GAME_SETTINGS, { gameId, settings });
  }

  startVote(topic: string) {
    this.logger.info('Emitting VOTE_STARTED event', { topic });
    this.socket.emit(SocketEvents.VOTE_STARTED, { topic });
  }

  submitVote(vote: boolean) {
    this.logger.info('Emitting VOTE_UPDATED event', { vote });
    this.socket.emit(SocketEvents.VOTE_UPDATED, { vote });
  }

  on(event: SocketEvents, callback: (...args: any[]) => void): void {
    this.logger.info('Adding event listener for', event);
    this.socket.on(event, (...args: any[]) => {
      this.logger.info(`Received ${event} event`, ...args);
      callback(...args);
    });
  }

  off(event: SocketEvents, callback?: (...args: any[]) => void): void {
    this.logger.info('Removing event listener for', event);
    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }
}

export const api = new Api();
