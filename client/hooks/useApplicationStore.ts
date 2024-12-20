// useApplicationStore.ts
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { api } from '../api';
import { newLogger } from '../logger';
import { PlayerInfo } from '../types';
import { useGameStore } from './useGameStore';
import { useLobbyStore } from './useLobbyStore';
import { useLocalPlayerSettings } from './useLocalPlayerSettings';
import { SocketEvents } from '../socketEvents';

const logger = newLogger('ApplicationStore');

interface ApplicationState {
  // UI State
  userLocation: 'lobby' | 'game';

  // Connection State
  isConnected: boolean;

  // Player Info
  localPlayer: PlayerInfo | null;
}

interface ApplicationActions {
  handleConnection: () => void;
  handleDisconnect: () => void;
  setIsConnected: (isConnected: boolean) => void;
  setUserLocation: (location: 'lobby' | 'game') => void;
  setLocalPlayer: (player: PlayerInfo | null) => void;
}

export type ApplicationStore = ApplicationState & ApplicationActions;

export const useApplicationStore = create<ApplicationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        userLocation: 'lobby',
        isConnected: false,
        localPlayer: null,

        // Actions
        handleConnection: () => {
          if (api.socket.connected) {
            logger.info('Connected to server');

            const { setIsConnected, setLocalPlayer } = get();
            const playerSettings = useLocalPlayerSettings.getState().settings;
            setIsConnected(true);

            if (api.socket.id) {
              setLocalPlayer({ id: api.socket.id, name: playerSettings.name });
            } else {
              logger.error('Socket ID not available');
            }
          }
        },

        handleDisconnect: () => {
          logger.info('Disconnected from server');
          const { setIsConnected, setUserLocation, setLocalPlayer } = get();
          setIsConnected(false);
          setUserLocation('lobby');
          setLocalPlayer(null);
        },

        setIsConnected: (isConnected: boolean) => set({ isConnected }),
        setUserLocation: (location: 'lobby' | 'game') => set({ userLocation: location }),
        setLocalPlayer: (player: PlayerInfo | null) => set({ localPlayer: player }),
      }),
      {
        name: 'application-state',
        storage: createJSONStorage(() => localStorage),
      },
    ),
  ),
);

let socketInitialized = false;

export const initializeSocketListeners = () => {
  if (socketInitialized) return;
  socketInitialized = true;

  const { handleDisconnect, handleConnection } = useApplicationStore.getState();

  const {
    setGameState,
    handleCardPlayed,
    handleTurnChanged,
    handleGameSettingsChanged,
    handleVoteUpdated,
    setIsGameStarting,
    setIsCardPlayedAnimationVisible,
  } = useGameStore.getState();

  const { setLobbyState, setLobbyPlayers, handlePlayerNameChanged, handlePlayerJoinedLobby, handlePlayerLeftLobby } =
    useLobbyStore.getState();

  // Connection events
  api.socket.on(SocketEvents.CONNECT, handleConnection);

  api.socket.on(SocketEvents.DISCONNECT, () => {
    logger.info('Disconnected from server');
    handleDisconnect();
  });

  // Game events
  api.socket.on(SocketEvents.GAME_STARTED, (payload) => {
    useApplicationStore.getState().setUserLocation('game');
    logger.info('Game started, user moved to game view', payload);
    setIsGameStarting(true);
  });

  api.socket.on(SocketEvents.GAME_STATE_UPDATED, (updatedGameState) => {
    logger.info('Game state updated', { updatedGameState });
    useApplicationStore.getState().setUserLocation('game');
    setGameState(updatedGameState);
  });

  api.socket.on(SocketEvents.CARD_PLAYED, handleCardPlayed);
  api.socket.on(SocketEvents.TURN_CHANGED, handleTurnChanged);
  api.socket.on(SocketEvents.GAME_SETTINGS_CHANGED, handleGameSettingsChanged);
  api.socket.on(SocketEvents.VOTE_UPDATED, handleVoteUpdated);

  // Lobby events
  api.socket.on(SocketEvents.LOBBY_UPDATE, (updatedLobbyState) => {
    logger.info('Lobby state updated', { updatedLobbyState });
    useApplicationStore.getState().setUserLocation('lobby');
    setLobbyState(updatedLobbyState);
  });

  api.socket.on(SocketEvents.PLAYER_NAME_CHANGED, handlePlayerNameChanged);
  api.socket.on(SocketEvents.PLAYER_JOINED_LOBBY, handlePlayerJoinedLobby);
  api.socket.on(SocketEvents.PLAYER_LEFT_LOBBY, handlePlayerLeftLobby);

  api.socket.on(SocketEvents.ERROR, (error: string) => {
    logger.error('Error:', error);
  });
};

export default useApplicationStore;
