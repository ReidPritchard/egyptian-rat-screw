import { newLogger } from "@/logger";
import type React from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { type Api, initializeApi } from "../api";
import { useApplicationStore } from "../store/useApplicationStore";
import { useGameStore } from "../store/useGameStore";
import { useLobbyStore } from "../store/useLobbyStore";

const logger = newLogger("ApiContext");

interface IApiContextType {
	api: Api | null;
}

const ApiContext = createContext<IApiContextType | null>(null);

export const useApi = () => {
	const context = useContext(ApiContext);
	if (!context) {
		throw new Error("useApi must be used within an ApiProvider");
	}
	return context.api;
};

interface IApiProviderProps {
	children: React.ReactNode;
}

export const ApiProvider: React.FC<IApiProviderProps> = ({ children }) => {
	const [api, setApi] = useState<Api | null>(null);
	const apiRef = useRef<Api | null>(null);

	useEffect(() => {
		// Initialize API with connection handlers
		const initApi = async () => {
			logger.info("Initializing API");
			const apiInstance = await initializeApi();
			setApi(apiInstance);
			apiRef.current = apiInstance;

			// Initialize store event subscriptions
			const messageClient = apiInstance.messageClient;
			useApplicationStore
				.getState()
				.initializeEventSubscriptions(messageClient);
			useGameStore.getState().initializeEventSubscriptions(messageClient);
			useLobbyStore.getState().initializeEventSubscriptions(messageClient);

			// Once connection is established, join the lobby
			apiInstance.joinLobby();
		};

		initApi().catch((error) => {
			console.error("Failed to initialize API:", error);
		});

		// Cleanup on unmount
		return () => {
			if (apiRef.current) {
				apiRef.current.messageClient.disconnect();
			}
		};
	}, []); // No dependencies needed since we use ref for cleanup

	return <ApiContext.Provider value={{ api }}>{children}</ApiContext.Provider>;
};
