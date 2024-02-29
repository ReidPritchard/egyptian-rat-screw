import type {
  Card,
  ClientPayload,
  DataPayload,
  SlapRule,
} from "@oers/game-core";
import { readonly, writable } from "svelte/store";

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
    handlePayload: (payload: DataPayload, name: string) => {
      const { type } = payload;
      switch (type) {
        case "game-started":
          update((state) => ({ ...state, status: "playing" }));
          break;
        case "game-status":
          const { players, scores, handSize, slapRules, pile, currentPlayer } =
            payload;
          update((state) => ({
            ...state,
            currentPlayer,
            score: scores[state.currentPlayer],
            numCardsInHand: handSize,
            slapRules,
            cardPile: pile,
          }));
          break;
        case "play-card-result":
          // Add the card to the pile, if this player played the card, reduce the number of cards in hand
          update((state) => ({
            ...state,
            cardPile: [...state.cardPile, payload.card],
            numCardsInHand:
              payload.name === name
                ? state.numCardsInHand - 1
                : state.numCardsInHand,
          }));
          break;
      }
    },
    generatePayload: (
      actionType: ClientPayload["type"],
      name: string,
      gameId?: string
    ): ClientPayload => {
      switch (actionType) {
        case "player-ready":
          return {
            type: "player-ready",
            name: name,
            isReady: true,
          };
        case "join-game":
          return {
            type: "join-game",
            name: name,
            gameId: gameId!,
          };
        case "slap-attempt":
          return {
            type: "slap-attempt",
            name: name,
          };
        case "play-card-attempt":
          return {
            type: "play-card-attempt",
            name: name,
          };
        default:
          throw new Error("Invalid action");
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
export const safeGameSessionStore = readonly(gameSessionStore);
