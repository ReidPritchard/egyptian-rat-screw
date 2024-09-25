import React, { createContext, useContext, useEffect, useState } from 'react';
import { GameStartAnimation } from '../animations/GameStartAnimation';
import { api } from '../api';
import { LocalPlayerSettings } from '../clientTypes';
import { SocketEvents } from '../socketEvents';
import { ClientGameState, GameSettings, LobbyState, PlayerInfo, VoteState } from '../types';
import { useLocalPlayerSettings } from './useLocalPlayerSettings';

interface ApplicationContextType {
  // UI State
  userLocation: 'lobby' | 'game';

  // Connection State
  isConnected: boolean;

  // Game State
  gameState: ClientGameState | null;
  localPlayer: PlayerInfo | null;
  isLocalPlayerTurn: boolean;

  // Lobby State
  lobbyState: LobbyState | null;
  lobbyPlayers: PlayerInfo[];

  // Player Settings
  localPlayerSettings: LocalPlayerSettings;
  updateLocalPlayerSettings: (newSettings: Partial<LocalPlayerSettings>) => void;

  // Lobby Actions
  fetchLobbyState: () => void;
  handleJoinLobby: () => void;

  // Game Starting State
  isGameStarting: boolean;
}

export const ApplicationContext = createContext<ApplicationContextType>({
  isConnected: false,
  gameState: null,
  localPlayer: null,
  isLocalPlayerTurn: false,
  lobbyState: null,
  lobbyPlayers: [],
  userLocation: 'lobby',
  localPlayerSettings: {
    name: '',
    hotkeys: {
      enable: true,
      playCard: 'Space',
      slap: 'S',
      vote: {
        yes: 'Y',
        no: 'N',
      },
      ready: 'R',
      settings: 'Escape',
    },
    ui: {
      actionLog: {
        expanded: false,
      },
    },
  },
  updateLocalPlayerSettings: () => {},
  fetchLobbyState: () => {},
  handleJoinLobby: () => {},
  isGameStarting: false,
});

export const ApplicationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const handleConnection = () => {
    if (api.socket.connected) {
      console.log('Connected to server');
      setIsConnected(true);

      if (api.socket.id) {
        setLocalPlayer({ id: api.socket.id, name: localPlayerSettings.name });
        // Emit change name event to ensure server has the correct name
        api.changeName({ name: localPlayerSettings.name });
      } else {
        console.error('Socket ID not available');
      }
    }
  };

  useEffect(() => {
    /**
     * WebSocket Connection and Event Listeners
     */
    api.socket.on(SocketEvents.CONNECT, handleConnection);

    // Handle disconnection
    api.socket.on(SocketEvents.DISCONNECT, () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setGameState(null);
      setLobbyState(null);
      setLobbyPlayers([]);
      setLocalPlayer(null);
    });

    api.socket.on(SocketEvents.GAME_STARTED, () => {
      setUserLocation('game');
      console.log('Game started');
      setIsGameStarting(true);
      // The animation will automatically hide after it's complete
    });

    // Handle game state updates
    api.socket.on(SocketEvents.GAME_STATE_UPDATED, (updatedGameState: ClientGameState) => {
      console.log('Game state updated', updatedGameState);
      setUserLocation('game');
      setGameState(updatedGameState);
    });

    // Handle game settings changes
    api.socket.on(SocketEvents.GAME_SETTINGS_CHANGED, (settings: GameSettings) => {
      setGameState((prevState) => (prevState ? { ...prevState, gameSettings: settings } : null));
    });

    // Handle vote updates
    api.socket.on(SocketEvents.VOTE_UPDATED, (voteState: VoteState) => {
      setGameState((prevState) => (prevState ? { ...prevState, voteState } : null));
    });

    // Handle lobby state updates
    api.socket.on(SocketEvents.LOBBY_UPDATE, (updatedLobbyState: LobbyState) => {
      setUserLocation('lobby');
      setLobbyState(updatedLobbyState);
    });

    api.socket.on(SocketEvents.PLAYER_NAME_CHANGED, (player: PlayerInfo) => {
      setLobbyPlayers((prevState) => prevState.map((p) => (p.id === player.id ? player : p)));
    });

    api.socket.on(SocketEvents.PLAYER_JOINED_LOBBY, (player: PlayerInfo) => {
      setLobbyPlayers((prevState) => [...prevState, player]);
    });

    api.socket.on(SocketEvents.PLAYER_LEFT_LOBBY, (playerId: string) => {
      setLobbyPlayers((prevState) => prevState.filter((player) => player.id !== playerId));
    });

    // Handle player ready status updates
    api.socket.on(SocketEvents.PLAYER_READY, (playerId: string, ready: boolean) => {
      setGameState((prevState) =>
        prevState ? { ...prevState, playerReadyStatus: { ...prevState.playerReadyStatus, [playerId]: ready } } : null,
      );
    });

    api.socket.on(SocketEvents.PLAYER_NOT_READY, (playerId: string) => {
      setGameState((prevState) =>
        prevState ? { ...prevState, playerReadyStatus: { ...prevState.playerReadyStatus, [playerId]: false } } : null,
      );
    });

    api.socket.on(SocketEvents.ERROR, (error: string) => {
      console.error('Error:', error);
    });

    // Cleanup on unmount
    return () => {
      api.socket.off(SocketEvents.CONNECT, handleConnection);
      api.socket.off(SocketEvents.DISCONNECT);

      api.socket.off(SocketEvents.GAME_STATE_UPDATED);
      api.socket.off(SocketEvents.GAME_SETTINGS_CHANGED);
      api.socket.off(SocketEvents.VOTE_UPDATED);

      api.socket.off(SocketEvents.LOBBY_UPDATE);
      api.socket.off(SocketEvents.PLAYER_JOINED_LOBBY);
      api.socket.off(SocketEvents.PLAYER_LEFT_LOBBY);
    };
  }, []);

  /**
   * Lobby Actions
   */
  const fetchLobbyState = () => {
    api.socket.emit(SocketEvents.LOBBY_UPDATE);
  };

  const handleJoinLobby = () => {
    api.socket.emit(SocketEvents.JOIN_LOBBY);
    setUserLocation('lobby');
  };

  // Connection State
  const [isConnected, setIsConnected] = useState(false);

  // Game State
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [localPlayer, setLocalPlayer] = useState<PlayerInfo | null>(null);

  // Lobby State
  const [lobbyState, setLobbyState] = useState<LobbyState | null>(null);
  const [lobbyPlayers, setLobbyPlayers] = useState<PlayerInfo[]>([]);

  // Player Settings
  const { settings: localPlayerSettings, updateSettings: updateLocalPlayerSettings } = useLocalPlayerSettings();

  // UI State
  const [userLocation, setUserLocation] = useState<'lobby' | 'game'>('lobby');

  // Determine if it's the local player's turn
  const isLocalPlayerTurn = gameState?.currentPlayerId === localPlayer?.id;

  // Game Starting State
  const [isGameStarting, setIsGameStarting] = useState(false);

  /**
   * Fetch initial lobby state on mount
   */
  useEffect(() => {
    if (isConnected) {
      fetchLobbyState();
      handleJoinLobby();
    }
  }, [isConnected]);

  // Call handleConnection whenever localPlayerSettings change
  useEffect(() => {
    handleConnection();
  }, [localPlayerSettings]);

  return (
    <ApplicationContext.Provider
      value={{
        isConnected,
        userLocation,
        gameState,
        localPlayer,
        isLocalPlayerTurn,
        lobbyState,
        lobbyPlayers,
        localPlayerSettings,
        updateLocalPlayerSettings,
        fetchLobbyState,
        handleJoinLobby,
        isGameStarting,
      }}
    >
      {children}
      <GameStartAnimation isVisible={isGameStarting} onAnimationComplete={() => setIsGameStarting(false)} />
    </ApplicationContext.Provider>
  );
};

export const useApplicationContext = () => useContext(ApplicationContext);
