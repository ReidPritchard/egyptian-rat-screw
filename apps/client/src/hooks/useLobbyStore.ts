import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '../api';
import { newLogger } from '../logger';
import { LobbyState, PlayerInfo, PlayerInfoUpdate } from '../types';
import useApplicationStore from './useApplicationStore';
import { useLocalPlayerSettings } from './useLocalPlayerSettings';
import { SocketEvents } from '../socketEvents';

const logger = newLogger('LobbyStore');

interface LobbyStoreState {
  lobbyState: LobbyState | null;
  lobbyPlayers: PlayerInfo[];
}

interface LobbyActions {
  setLobbyState: (lobbyState: LobbyState | null) => void;
  setLobbyPlayers: (players: PlayerInfo[]) => void;
  handleLobbyPlayerUpdate: (playerUpdates: PlayerInfoUpdate[]) => void;
  handleJoinLobby: () => void;
  handleJoinGame: (gameId: string) => void;
  handleCreateGame: () => void;
}

export type LobbyStore = LobbyStoreState & LobbyActions;

export const useLobbyStore = create<LobbyStore>()(
  devtools((set, get) => ({
    // Initial state
    lobbyState: null,
    lobbyPlayers: [],

    // Actions
    setLobbyState: (lobbyState: LobbyState | null) => set({ lobbyState }),
    setLobbyPlayers: (players: PlayerInfo[]) => set({ lobbyPlayers: players }),

    handleLobbyPlayerUpdate: (playerUpdates: PlayerInfoUpdate[]) => {
      logger.info('Lobby player update', playerUpdates);

      const prevPlayers = get().lobbyPlayers || [];
      const updatedPlayers = playerUpdates.reduce((acc, player) => {
        switch (player.action) {
          case 'join':
            return [...acc, player];
          case 'leave':
            return acc.filter((p) => p.id !== player.id);
          case 'update':
            return acc.map((p) => (p.id === player.id ? player : p));
        }
      }, prevPlayers);
      get().setLobbyPlayers(updatedPlayers);
    },

    handleJoinLobby: () => {
      logger.info('Joining lobby');
      api.socket.emit(SocketEvents.JOIN_LOBBY);
      useApplicationStore.getState().setUserLocation('lobby');
    },

    handleJoinGame: (gameId: string) => {
      logger.info('Joining game', { gameId });
      api.joinGame({ gameId });
      // Location will be updated by GAME_STARTED event
    },

    handleCreateGame: () => {
      logger.info('Creating game');
      const playerName = useLocalPlayerSettings.getState().settings.name;
      if (playerName) {
        api.createGame({ playerName });
      } else {
        logger.error('Cannot create game: player name not set');
      }
    },
  })),
);
