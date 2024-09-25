import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { CardPlayedAnimation, GameStartAnimation } from '../animations';
import { api } from '../api';
import { LocalPlayerSettings } from '../clientTypes';
import { newLogger } from '../logger';
import { CardPlayedPayload, PlayCardPayload, SocketEvents } from '../socketEvents';
import { ClientGameState, GameSettings, LobbyState, PlayerInfo, VoteState } from '../types';
import { useLocalPlayerSettings } from './useLocalPlayerSettings';

const logger = newLogger('ApplicationState');

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

  // Animation States
  isGameStarting: boolean;
  isCardPlayedAnimationVisible: boolean;

  // Card Stack Reference
  cardStackRef: React.RefObject<HTMLDivElement>;
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
  isCardPlayedAnimationVisible: false,
  cardStackRef: { current: null },
});

export const ApplicationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const handleConnection = () => {
    if (api.socket.connected) {
      logger.info('Connected to server');
      setIsConnected(true);

      if (api.socket.id) {
        setLocalPlayer({ id: api.socket.id, name: localPlayerSettings.name });
      } else {
        logger.error('Socket ID not available');
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
      logger.info('Disconnected from server');
      setIsConnected(false);
      setGameState(null);
      setLobbyState(null);
      setLobbyPlayers([]);
      setLocalPlayer(null);
      logger.info('Reset all state due to disconnection');
    });

    api.socket.on(SocketEvents.GAME_STARTED, () => {
      setUserLocation('game');
      logger.info('Game started, user moved to game view');
      setIsGameStarting(true);
      // The animation will automatically hide after it's complete
    });

    // Handle game state updates
    api.socket.on(SocketEvents.GAME_STATE_UPDATED, (updatedGameState: ClientGameState) => {
      logger.info('Game state updated', { updatedGameState });
      setUserLocation('game');
      setGameState(updatedGameState);
    });

    api.socket.on(SocketEvents.CARD_PLAYED, (payload: CardPlayedPayload) => {
      logger.info('Card played', { payload });
      setIsCardPlayedAnimationVisible(true);
    });

    api.socket.on(SocketEvents.PLAY_CARD, (payload: PlayCardPayload) => {
      logger.info('Play card', { payload });
      setIsCardPlayedAnimationVisible(true);
    });

    // Handle game settings changes
    api.socket.on(SocketEvents.GAME_SETTINGS_CHANGED, (settings: GameSettings) => {
      logger.info('Game settings changed', { settings });
      setGameState((prevState) => (prevState ? { ...prevState, gameSettings: settings } : null));
    });

    // Handle vote updates
    api.socket.on(SocketEvents.VOTE_UPDATED, (voteState: VoteState) => {
      logger.info('Vote state updated', { voteState });
      setGameState((prevState) => (prevState ? { ...prevState, voteState } : null));
    });

    // Handle lobby state updates
    api.socket.on(SocketEvents.LOBBY_UPDATE, (updatedLobbyState: LobbyState) => {
      logger.info('Lobby state updated', { updatedLobbyState });
      setUserLocation('lobby');
      setLobbyState(updatedLobbyState);
    });

    api.socket.on(SocketEvents.PLAYER_NAME_CHANGED, (player: PlayerInfo) => {
      logger.info('Player name changed', { player });
      setLobbyPlayers((prevState) => prevState.map((p) => (p.id === player.id ? player : p)));
    });

    api.socket.on(SocketEvents.PLAYER_JOINED_LOBBY, (player: PlayerInfo) => {
      logger.info('Player joined lobby', { player });
      setLobbyPlayers((prevState) => [...prevState, player]);
    });

    api.socket.on(SocketEvents.PLAYER_LEFT_LOBBY, (playerId: string) => {
      logger.info('Player left lobby', { playerId });
      setLobbyPlayers((prevState) => prevState.filter((player) => player.id !== playerId));
    });

    // Handle player ready status updates
    api.socket.on(SocketEvents.PLAYER_READY, (playerId: string, ready: boolean) => {
      logger.info('Player ready status changed', { playerId, ready });
      setGameState((prevState) =>
        prevState ? { ...prevState, playerReadyStatus: { ...prevState.playerReadyStatus, [playerId]: ready } } : null,
      );
    });

    api.socket.on(SocketEvents.PLAYER_NOT_READY, (playerId: string) => {
      logger.info('Player not ready', { playerId });
      setGameState((prevState) =>
        prevState ? { ...prevState, playerReadyStatus: { ...prevState.playerReadyStatus, [playerId]: false } } : null,
      );
    });

    api.socket.on(SocketEvents.ERROR, (error: string) => {
      logger.error('Error:', error);
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
    logger.info('Fetching lobby state');
    api.socket.emit(SocketEvents.LOBBY_UPDATE);
  };

  const handleJoinLobby = () => {
    logger.info('Joining lobby');
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

  // Animation States
  // Game Starting State
  const [isGameStarting, setIsGameStarting] = useState(false);

  // Player Action Animations
  const [isCardPlayedAnimationVisible, setIsCardPlayedAnimationVisible] = useState(false);

  // Card Stack Reference
  const cardStackRef = useRef<HTMLDivElement>(null);

  /**
   * Fetch initial lobby state on mount
   */
  useEffect(() => {
    if (isConnected) {
      logger.info('Connected, fetching initial lobby state');
      fetchLobbyState();
      handleJoinLobby();
    }
  }, [isConnected]);

  // Call handleConnection whenever localPlayerSettings change
  useEffect(() => {
    logger.info('Local player settings changed, reconnecting', { localPlayerSettings });
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
        isCardPlayedAnimationVisible,
        cardStackRef,
      }}
    >
      {children}
      <GameStartAnimation isVisible={isGameStarting} onAnimationComplete={() => setIsGameStarting(false)} />
      <CardPlayedAnimation
        isVisible={isCardPlayedAnimationVisible}
        card={gameState?.pileCards[gameState.pileCards.length - 1] ?? null}
        onAnimationComplete={() => {
          setIsCardPlayedAnimationVisible(false);
        }}
        targetRef={cardStackRef}
      />
    </ApplicationContext.Provider>
  );
};

export const useApplicationContext = () => useContext(ApplicationContext);
