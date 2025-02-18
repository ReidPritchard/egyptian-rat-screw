import type React from "react";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import { type Api, initializeApi } from "../api";
import { useApplicationStore } from "../store/useApplicationStore";
import { useGameStore } from "../store/useGameStore";
import { useLobbyStore } from "../store/useLobbyStore";

interface ApiContextType {
  api: Api | null;
}

const ApiContext = createContext<ApiContextType | null>(null);

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return context.api;
};

interface ApiProviderProps {
  children: React.ReactNode;
}

export const ApiProvider: React.FC<ApiProviderProps> = ({ children }) => {
  const [api, setApi] = useState<Api | null>(null);
  const apiRef = useRef<Api | null>(null);

  // TODO: Revisit if we need to handle connection and disconnect events here
  const handleConnection = useApplicationStore(
    (state) => state.handleConnection
  );
  const handleDisconnect = useApplicationStore(
    (state) => state.handleDisconnect
  );

  useEffect(() => {
    // Initialize API with connection handlers
    const initApi = async () => {
      const apiInstance = await initializeApi();
      setApi(apiInstance);
      apiRef.current = apiInstance;

      // Initialize store event subscriptions
      useApplicationStore.getState().initializeEventSubscriptions(apiInstance);
      useGameStore.getState().initializeEventSubscriptions(apiInstance);
      useLobbyStore.getState().initializeEventSubscriptions(apiInstance);
    };

    initApi().catch((error) => {
      console.error("Failed to initialize API:", error);
    });

    // Cleanup on unmount
    return () => {
      if (apiRef.current) {
        apiRef.current.messenger.disconnect();
      }
    };
  }, []); // No dependencies needed since we use ref for cleanup

  return <ApiContext.Provider value={{ api }}>{children}</ApiContext.Provider>;
};
