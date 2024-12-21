import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '../api';
import { newLogger } from '../logger';
import { LobbyState, PlayerInfo, PlayerInfoUpdate } from '../types';
import useApplicationStore from './useApplicationStore';
import { useLocalPlayerSettings } from './useLocalPlayerSettings';

const logger = newLogger('LobbyStore');

interface LobbyStoreState {
  lobbyState: LobbyState | null;
  lobbyPlayers: PlayerInfo[];
}

interface LobbyActions {
  setLobbyState: (lobbyState: LobbyState | null) => void;
  setLobbyPlayers: (players: PlayerInfo[]) => void;
  handleLobbyPlayerUpdate: (playerUpdates: PlayerInfoUpdate[]) => void;
  fetchLobbyState: () => void;
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

    fetchLobbyState: () => {
      logger.info('Fetching lobby state');
      api.socket.emit('LOBBY_UPDATE');
    },

    handleJoinLobby: () => {
      logger.info('Joining lobby');
      api.socket.emit('JOIN_LOBBY');
      useApplicationStore.getState().setUserLocation('lobby');
    },

    handleJoinGame: (gameId: string) => {
      logger.info('Joining game', { gameId });
      api.joinGame({ gameId });
      useApplicationStore.getState().setUserLocation('game');
    },

    handleCreateGame: () => {
      logger.info('Creating game');
      const playerName = useLocalPlayerSettings.getState().settings.name;
      if (playerName) {
        api.createGame({ playerName });
        useApplicationStore.getState().setUserLocation('game');
      } else {
        logger.error('Cannot create game: player name not set');
      }
    },
  })),
);
