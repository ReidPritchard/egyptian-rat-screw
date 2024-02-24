import type { Card, DataPayload, SlapRule } from "@oers/game-core";
import { writable } from "svelte/store";

export interface GameSession {
  currentPlayer: string;
  score: number;
  status: "playing" | "paused" | "ended";
  cardPile: Card[];
  numCardsInHand: number;
  slapRules: SlapRule[];
  notify?: string;
}

const createGameSessionStore = () => {
  const { subscribe, set, update } = writable<GameSession>({
    currentPlayer: "",
    score: 0,
    status: "paused",
    cardPile: [],
    numCardsInHand: 0,
    slapRules: [],
  });

  return {
    subscribe,
    setPlayer: (name: string) =>
      update((state) => ({ ...state, currentPlayer: name })),
    addScore: (points: number) =>
      update((state) => ({ ...state, score: state.score + points })),
    setStatus: (status: "playing" | "paused" | "ended") =>
      update((state) => ({ ...state, status })),
    setPile: (pile: Card[]) =>
      update((state) => ({ ...state, cardPile: pile })),
    addCardToPile: (card: Card) =>
      update((state) => ({ ...state, cardPile: [...state.cardPile, card] })),
    notify: (message: string) =>
      update((state) => ({ ...state, notify: message })),
    setNumCardsInHand: (num: number) =>
      update((state) => ({ ...state, numCardsInHand: num })),
    handlePayload: (payload: DataPayload) => {
      const { type } = payload;
      switch (type) {
        case "game-started":
          set({
            currentPlayer: payload.players[0],
            score: 0,
            status: "playing",
            cardPile: [],
            numCardsInHand: payload.handSize,
            slapRules: payload.slapRules,
          });
          break;
      }
    },
    reset: () =>
      set({
        currentPlayer: "",
        score: 0,
        status: "paused",
        cardPile: [],
        slapRules: [],
        numCardsInHand: 0,
        notify: undefined,
      }),
  };
};

export const gameSessionStore = createGameSessionStore();
