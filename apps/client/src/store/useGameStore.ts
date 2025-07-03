import type { MessageClient } from "@/message/client";
import {
	type ICardPlayedPayload,
	SocketEvents,
	type TurnChangedPayload,
} from "@oer/shared/socketEvents";
import type {
	ClientGameState,
	GameSettings,
	VoteState,
} from "@oer/shared/types";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { useApi } from "../contexts/ApiContext";
import { newLogger } from "../logger";
import useApplicationStore from "./useApplicationStore";

const logger = newLogger("GameStore");

interface IGameState {
	gameState: ClientGameState | null;
	isLocalPlayerTurn: boolean;
	isGameStarting: boolean;
	isCardPlayedAnimationVisible: boolean;
}

interface IGameActions {
	setGameState: (gameState: ClientGameState | null) => void;
	handleCardPlayed: (payload: ICardPlayedPayload) => void;
	handleTurnChanged: (payload: TurnChangedPayload) => void;
	handleGameSettingsChanged: (settings: GameSettings) => void;
	handleVoteUpdated: (voteState: VoteState) => void;
	setIsGameStarting: (isGameStarting: boolean) => void;
	setIsCardPlayedAnimationVisible: (isVisible: boolean) => void;
	// Game action methods
	playCard: () => void;
	slapPile: () => void;
	setGameSettings: (settings: GameSettings) => void;
	playerReady: (api: NonNullable<ReturnType<typeof useApi>>) => void;
	startVote: (topic: string) => void;
	submitVote: (vote: boolean) => void;
	// Event subscription
	initializeEventSubscriptions: (messageClient: MessageClient) => void;
}

export type GameStore = IGameState & IGameActions;

export const useGameStore = create<GameStore>()(
	devtools((set, get) => ({
		// Initial state
		gameState: null,
		isLocalPlayerTurn: false,
		isGameStarting: false,
		isCardPlayedAnimationVisible: false,

		// Event subscription initialization
		initializeEventSubscriptions: (api) => {
			// Game event handlers
			api.on(SocketEvents.GAME_STARTED, () => {
				logger.info("Game started");
				useApplicationStore.getState().setUserLocation("game");
				get().setIsGameStarting(true);
			});

			api.on(
				SocketEvents.GAME_STATE_UPDATED,
				(updatedGameState: ClientGameState) => {
					useApplicationStore.getState().setUserLocation("game");
					get().setGameState(updatedGameState);
				},
			);

			api.on(SocketEvents.CARD_PLAYED, get().handleCardPlayed);
			api.on(SocketEvents.TURN_CHANGED, get().handleTurnChanged);
			api.on(
				SocketEvents.GAME_SETTINGS_CHANGED,
				get().handleGameSettingsChanged,
			);
			api.on(SocketEvents.VOTE_UPDATED, get().handleVoteUpdated);
		},

		// Actions
		setGameState: (gameState: ClientGameState | null) => {
			set({ gameState });
			// Update local player turn status
			const localPlayer = useApplicationStore.getState().localPlayer;
			set({
				isLocalPlayerTurn: gameState?.currentPlayerId === localPlayer?.id,
			});
		},

		handleCardPlayed: (payload: ICardPlayedPayload) => {
			logger.info("Card played", { data: payload });
			set({ isCardPlayedAnimationVisible: true });

			const prevState = get().gameState;
			if (!prevState) return;

			const updatedPileCards = [...prevState.centralPile, payload.card];
			const updatedPlayers = prevState.players.map((player) =>
				player.id === payload.playerId
					? { ...player, cardCount: player.cardCount - 1 }
					: player,
			);

			const newGameState = {
				...prevState,
				centralPile: updatedPileCards,
				players: updatedPlayers,
			};
			get().setGameState(newGameState);
		},

		handleTurnChanged: (payload: TurnChangedPayload) => {
			logger.info("Turn changed", { data: payload });
			set({ isCardPlayedAnimationVisible: false });

			const prevState = get().gameState;
			if (!prevState) return;

			const newGameState = {
				...prevState,
				currentPlayerId: payload.currentPlayerId,
			};
			get().setGameState(newGameState);
		},

		handleGameSettingsChanged: (settings: GameSettings) => {
			logger.info("Game settings changed", { data: settings });
			const prevState = get().gameState;
			if (!prevState) return;

			const newGameState = { ...prevState, gameSettings: settings };
			get().setGameState(newGameState);
		},

		handleVoteUpdated: (voteState: VoteState) => {
			logger.info("Vote state updated", { data: voteState });
			const prevState = get().gameState;
			if (!prevState) return;

			const newGameState = { ...prevState, voteState };
			get().setGameState(newGameState);
		},

		setIsGameStarting: (isGameStarting: boolean) => set({ isGameStarting }),
		setIsCardPlayedAnimationVisible: (isVisible: boolean) =>
			set({ isCardPlayedAnimationVisible: isVisible }),

		// Game action methods using API context
		playCard: () => {
			const api = useApi();
			if (!api) {
				logger.error("Cannot play card: API not initialized");
				return;
			}
			const localPlayer = useApplicationStore.getState().localPlayer;
			if (!localPlayer) {
				logger.error("Cannot play card: Local player not set");
				return;
			}
			api.playCard({ playerId: localPlayer.id });
		},

		slapPile: () => {
			const api = useApi();
			if (!api) {
				logger.error("Cannot slap pile: API not initialized");
				return;
			}
			const localPlayer = useApplicationStore.getState().localPlayer;
			if (!localPlayer) {
				logger.error("Cannot slap pile: Local player not set");
				return;
			}
			api.slapPile({ playerId: localPlayer.id });
		},

		playerReady: (api: NonNullable<ReturnType<typeof useApi>>) => {
			if (!api) {
				logger.error("Cannot ready player: API not initialized");
				return;
			}
			const localPlayer = useApplicationStore.getState().localPlayer;
			if (!localPlayer) {
				logger.error("Cannot ready player: Local player not set");
				return;
			}
			api.playerReady(localPlayer);

			const gameState = get().gameState;
			if (!gameState) {
				logger.error("Cannot ready player: Game state not available");
				return;
			}
			const newGameState = {
				...gameState,
				players: gameState.players.map((player) =>
					player.id === localPlayer.id ? { ...player, isReady: true } : player,
				),
			};
			get().setGameState(newGameState);
		},
		setGameSettings: (settings: GameSettings) => {
			const api = useApi();
			if (!api) {
				logger.error("Cannot update game settings: API not initialized");
				return;
			}
			const gameState = get().gameState;
			if (!gameState) {
				logger.error("Cannot update game settings: Game state not available");
				return;
			}
			api.setGameSettings(settings);
		},

		startVote: (topic: string) => {
			const api = useApi();
			if (!api) {
				logger.error("Cannot start vote: API not initialized");
				return;
			}
			api.startVote(topic);
		},

		submitVote: (vote: boolean) => {
			const api = useApi();
			if (!api) {
				logger.error("Cannot submit vote: API not initialized");
				return;
			}
			api.submitVote(vote);
		},
	})),
);
