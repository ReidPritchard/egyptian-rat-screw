import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { api } from '../api';
import { newLogger } from '../logger';
import { ClientGameState, GameSettings, PlayerInfo, VoteState } from '../types';
import { CardPlayedPayload, TurnChangedPayload } from '../socketEvents';
import useApplicationStore from './useApplicationStore';

const logger = newLogger('GameStore');

interface GameState {
  gameState: ClientGameState | null;
  isLocalPlayerTurn: boolean;
  isGameStarting: boolean;
  isCardPlayedAnimationVisible: boolean;
}

interface GameActions {
  setGameState: (gameState: ClientGameState | null) => void;
  handleCardPlayed: (payload: CardPlayedPayload) => void;
  handleTurnChanged: (payload: TurnChangedPayload) => void;
  handleGameSettingsChanged: (settings: GameSettings) => void;
  handleVoteUpdated: (voteState: VoteState) => void;
  setIsGameStarting: (isGameStarting: boolean) => void;
  setIsCardPlayedAnimationVisible: (isVisible: boolean) => void;
}

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>()(
  devtools((set, get) => ({
    // Initial state
    gameState: null,
    isLocalPlayerTurn: false,
    isGameStarting: false,
    isCardPlayedAnimationVisible: false,

    // Actions
    setGameState: (gameState: ClientGameState | null) => {
      set({ gameState });
      // Update local player turn status
      const localPlayer = useApplicationStore.getState().localPlayer;
      set({
        isLocalPlayerTurn: gameState?.currentPlayerId === localPlayer?.id,
      });
    },

    handleCardPlayed: (payload: CardPlayedPayload) => {
      logger.info('Card played', { payload });
      set({ isCardPlayedAnimationVisible: true });

      const prevState = get().gameState;
      if (!prevState) return;

      const updatedPileCards = [...prevState.pileCards, payload.card];
      const updatedPlayerHands = { ...prevState.playerHandSizes };
      if (payload.playerId in updatedPlayerHands) {
        updatedPlayerHands[payload.playerId] -= 1;
      }

      const newGameState = {
        ...prevState,
        pileCards: updatedPileCards,
        playerHandSizes: updatedPlayerHands,
      };
      get().setGameState(newGameState);
    },

    handleTurnChanged: (payload: TurnChangedPayload) => {
      logger.info('Turn changed', { payload });
      set({ isCardPlayedAnimationVisible: false });

      const prevState = get().gameState;
      if (!prevState) return;

      const newGameState = { ...prevState, currentPlayerId: payload.currentPlayerId };
      get().setGameState(newGameState);
    },

    handleGameSettingsChanged: (settings: GameSettings) => {
      logger.info('Game settings changed', { settings });
      const prevState = get().gameState;
      if (!prevState) return;

      const newGameState = { ...prevState, gameSettings: settings };
      get().setGameState(newGameState);
    },

    handleVoteUpdated: (voteState: VoteState) => {
      logger.info('Vote state updated', { voteState });
      const prevState = get().gameState;
      if (!prevState) return;

      const newGameState = { ...prevState, voteState };
      get().setGameState(newGameState);
    },

    setIsGameStarting: (isGameStarting: boolean) => set({ isGameStarting }),
    setIsCardPlayedAnimationVisible: (isVisible: boolean) => set({ isCardPlayedAnimationVisible: isVisible }),
  })),
);
