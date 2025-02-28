import type { MessageClient } from "@/message/client";
import { MessengerEvents } from "@oer/message";
import { SocketEvents } from "@oer/shared/socketEvents";
import type { PlayerInfo } from "@oer/shared/types";
import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { useLocalPlayerSettings } from "../hooks/useLocalPlayerSettings.js";
import { newLogger } from "../logger";

const logger = newLogger("ApplicationStore");

/**
 * App-wide state.
 * Anything that spans multiple views (e.g. connection state, player info, etc.)
 */
interface IApplicationState {
  // UI State
  userLocation: "lobby" | "game";

  // Connection State
  isConnected: boolean;

  // Player Info
  localPlayer: PlayerInfo | null;
}

interface IApplicationActions {
  handleConnection: () => void;
  handleDisconnect: () => void;
  initializeEventSubscriptions: (messageClient: MessageClient) => void;
  setIsConnected: (isConnected: boolean) => void;
  setUserLocation: (location: "lobby" | "game") => void;
  setLocalPlayer: (player: PlayerInfo | null) => void;
}

export type ApplicationStore = IApplicationState & IApplicationActions;

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
            isBot: false,
          });
        },

        handleDisconnect: () => {
          logger.info("Disconnected from server");
          const { setIsConnected, setUserLocation, setLocalPlayer } = get();
          setIsConnected(false);
          setUserLocation("lobby");
          setLocalPlayer(null);
        },

        initializeEventSubscriptions: (messageClient: MessageClient) => {
          messageClient.on(
            MessengerEvents.JOIN_ROOM,
            (data: { room: string }) => {
              logger.info("Joined room", { data });
              if (data.room === "lobby") {
                get().setUserLocation("lobby");
              } else {
                get().setUserLocation("game");
              }
            }
          );

          messageClient.on(SocketEvents.ERROR, (data: { message: string }) => {
            logger.error("Error", { data });
          });

          // Update the local player's ID now that it's synced with the server
          const currentLocalPlayer = get().localPlayer;
          set({
            localPlayer: {
              id: messageClient.id,
              name: currentLocalPlayer?.name ?? messageClient.id,
              isBot: false,
            },
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
