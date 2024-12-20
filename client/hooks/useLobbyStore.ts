import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '../api';
import { newLogger } from '../logger';
import { LobbyState, PlayerInfo } from '../types';
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
  handlePlayerNameChanged: (player: PlayerInfo) => void;
  handlePlayerJoinedLobby: (player: PlayerInfo) => void;
  handlePlayerLeftLobby: (player: PlayerInfo) => void;
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

    handlePlayerNameChanged: (player: PlayerInfo) => {
      logger.info('Player name changed', { player });
      const prevPlayers = get().lobbyPlayers;
      const updatedPlayers = prevPlayers.map((p) => (p.id === player.id ? player : p));
      get().setLobbyPlayers(updatedPlayers);
    },

    handlePlayerJoinedLobby: (player: PlayerInfo) => {
      logger.info('Player joined lobby', { player });
      const prevPlayers = get().lobbyPlayers;
      get().setLobbyPlayers([...prevPlayers, player]);
    },

    handlePlayerLeftLobby: (player: PlayerInfo) => {
      logger.info('Player left lobby', { player });
      const prevPlayers = get().lobbyPlayers;
      const updatedPlayers = prevPlayers.filter((p) => p.id !== player.id);
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
