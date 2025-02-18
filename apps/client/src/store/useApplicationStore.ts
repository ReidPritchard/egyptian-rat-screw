// useApplicationStore.ts
import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { newLogger } from "../logger";
import type { PlayerInfo } from "../types.js";
import { useLocalPlayerSettings } from "../hooks/useLocalPlayerSettings.js";
import type { useApi } from "../contexts/ApiContext.js";
import { SocketEvents } from "@/socketEvents";
const logger = newLogger("ApplicationStore");

/**
 * App-wide state.
 * Anything that spans multiple views (e.g. connection state, player info, etc.)
 */
interface ApplicationState {
  // UI State
  userLocation: "lobby" | "game";

  // Connection State
  isConnected: boolean;

  // Player Info
  localPlayer: PlayerInfo | null;
}

interface ApplicationActions {
  handleConnection: () => void;
  handleDisconnect: () => void;
  initializeEventSubscriptions: (
    api: NonNullable<ReturnType<typeof useApi>>
  ) => void;
  setIsConnected: (isConnected: boolean) => void;
  setUserLocation: (location: "lobby" | "game") => void;
  setLocalPlayer: (player: PlayerInfo | null) => void;
}

export type ApplicationStore = ApplicationState & ApplicationActions;

export const useApplicationStore = create<ApplicationStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        userLocation: "lobby",
        isConnected: false,
        localPlayer: null,

        // Actions
        handleConnection: () => {
          logger.info("Connected to server");
          const { setIsConnected, setLocalPlayer } = get();
          const playerSettings = useLocalPlayerSettings.getState().settings;
          setIsConnected(true);

          // Note: The messenger ID will be accessed through the API context in components
          setLocalPlayer({
            id: "pending", // Will be updated when API is available
            name: playerSettings.name,
          });
        },

        handleDisconnect: () => {
          logger.info("Disconnected from server");
          const { setIsConnected, setUserLocation, setLocalPlayer } = get();
          setIsConnected(false);
          setUserLocation("lobby");
          setLocalPlayer(null);
        },

        initializeEventSubscriptions: (api) => {
          api.on("join_room" as any, (data: { room: string }) => {
            logger.info("Joined room", { data });
            if (data.room === "lobby") {
              get().setUserLocation("lobby");
            } else {
              get().setUserLocation("game");
            }
          });
        },

        setIsConnected: (isConnected: boolean) => set({ isConnected }),
        setUserLocation: (location: "lobby" | "game") =>
          set({ userLocation: location }),
        setLocalPlayer: (player: PlayerInfo | null) =>
          set({ localPlayer: player }),
      }),
      {
        name: "application-state",
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
);

export default useApplicationStore;
