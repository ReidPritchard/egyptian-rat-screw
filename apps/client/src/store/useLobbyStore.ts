import type { MessageClient } from "@/message/client";
import { SocketEvents } from "@oer/shared/socketEvents";
import type {
  LobbyState,
  PlayerInfo,
  PlayerInfoUpdate,
} from "@oer/shared/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { useApi } from "../contexts/ApiContext";
import { newLogger } from "../logger";
import useApplicationStore from "./useApplicationStore";

// Create a logger specific for the lobby store
const logger = newLogger("LobbyStore");

// Define the state interface
interface ILobbyStoreState {
  lobbyState: LobbyState | null;
  lobbyPlayers: PlayerInfo[];
}

// Define the actions interface
interface ILobbyActions {
  setLobbyState: (lobbyState: LobbyState | null) => void;
  setLobbyPlayers: (players: PlayerInfo[]) => void;
  handleLobbyPlayerUpdate: (playerUpdates: PlayerInfoUpdate[]) => void;
  handleJoinLobby: (api: NonNullable<ReturnType<typeof useApi>>) => void;
  handleJoinGame: (
    api: NonNullable<ReturnType<typeof useApi>>,
    roomId: string
  ) => void;
  handleCreateGame: (
    api: NonNullable<ReturnType<typeof useApi>>,
    playerName: string
  ) => void;
  // Event subscription
  initializeEventSubscriptions: (messageClient: MessageClient) => void;
}

// Combine state and actions into one type
export type LobbyStore = ILobbyStoreState & ILobbyActions;

/**
 * Zustand store for lobby-related state and actions.
 * Uses devtools middleware for easier debugging.
 */
export const useLobbyStore = create<LobbyStore>()(
  devtools((set, get) => ({
    // Initial state
    lobbyState: null,
    lobbyPlayers: [],

    /**
     * Initializes API event subscriptions.
     * @param api - API instance for socket connections.
     */
    initializeEventSubscriptions: (messageClient: MessageClient) => {
      // Handle lobby state update events
      messageClient.on(
        SocketEvents.LOBBY_GAME_UPDATE,
        (updatedLobbyState: LobbyState) => {
          logger.info("Lobby state updated", { data: updatedLobbyState });
          // Ensure the application location remains in lobby if not in game
          const appState = useApplicationStore.getState();
          if (appState.userLocation !== "game") {
            appState.setUserLocation("lobby");
          }
          get().setLobbyState(updatedLobbyState);
        }
      );

      // Handle lobby player update events
      messageClient.on(
        SocketEvents.LOBBY_PLAYER_UPDATE,
        get().handleLobbyPlayerUpdate
      );

      // Handle generic errors from the API
      messageClient.on(SocketEvents.ERROR, (error: string) => {
        logger.error("Error occurred", { data: error });
      });
    },

    /**
     * Updates the lobby state.
     * @param lobbyState - The new lobby state.
     */
    setLobbyState: (lobbyState: LobbyState | null) => set({ lobbyState }),

    /**
     * Updates the list of lobby players.
     * @param players - Array of current lobby players.
     */
    setLobbyPlayers: (players: PlayerInfo[]) => set({ lobbyPlayers: players }),

    /**
     * Processes updates for players in the lobby.
     * Handles join, leave, and update actions.
     * @param playerUpdates - Array of updates to be applied.
     */
    handleLobbyPlayerUpdate: (playerUpdates: PlayerInfoUpdate[]) => {
      logger.info("Processing lobby player updates", { data: playerUpdates });
      // Start with a copy of the current players
      let players = [...get().lobbyPlayers];
      // Process each update one-by-one
      for (const update of playerUpdates) {
        switch (update.action) {
          case "join":
            // Add new player to the list
            players.push(update);
            break;
          case "leave":
            // Remove player from the list
            players = players.filter((player) => player.id !== update.id);
            break;
          case "update": {
            const playerExists = players.find(
              (player) => player.id === update.id
            );
            if (playerExists) {
              // Update existing player info
              players = players.map((player) =>
                player.id === update.id ? update : player
              );
            } else {
              // Add new player to the list
              players.push(update);
            }
            break;
          }
        }
      }
      get().setLobbyPlayers(players);
    },

    /**
     * Handles the action of joining the lobby.
     * Uses the API to join and updates the application location.
     * @param api - API instance for socket connections
     */
    handleJoinLobby: (api) => {
      logger.info("Joining lobby");
      api.joinLobby();
      useApplicationStore.getState().setUserLocation("lobby");
    },

    /**
     * Handles the action of joining a game.
     * Uses the API to join the specified game.
     * @param api - API instance for socket connections
     * @param gameId - Identifier for the game to join.
     */
    handleJoinGame: (api, roomId: string) => {
      logger.info("Joining game", { data: { roomId } });
      api.joinGame({ roomId });
      // User location will be updated by the GAME_STARTED event.
    },

    /**
     * Handles the action of creating a new game.
     * @param api - API instance for socket connections
     * @param playerName - Name of the player creating the game
     */
    handleCreateGame: (api, playerName: string) => {
      logger.info("Creating game");
      if (playerName) {
        api.createGame({ playerName });
      } else {
        logger.error("Cannot create game: player name not set");
      }
    },
  }))
);
