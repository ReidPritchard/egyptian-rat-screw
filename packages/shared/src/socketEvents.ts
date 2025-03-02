import type {
  Card,
  ClientGameState,
  GameSettings,
  GameStatus,
  LobbyState,
  PlayerAction,
  PlayerInfo,
  PlayerInfoUpdate,
  VoteState,
} from "./types.js";

/**
 * @enum SocketEvents
 * @description Centralizes all socket event names and their corresponding types.
 */
export enum SocketEvents {
  ///////////////////////
  // Connection Events //
  ///////////////////////

  /**
   * @description Emitted to both the client and server when a client connects
   * for the first time.
   */
  CONNECT = "connect",

  /**
   * @description Used by the server to clean up client related state when they
   * disconnect.
   */
  DISCONNECTING = "disconnecting",

  /**
   * @description Used by both the client and server when disconnected
   */
  DISCONNECT = "disconnect",

  ///////////////////////
  // Lobby Events //
  ///////////////////////

  /**
   * @description Emitted to the lobby room to update the active games.
   * @see GameManager.emitLobbyUpdate
   */
  LOBBY_GAME_UPDATE = "lobbyGameUpdate",

  /**
   * @description Emitted to the lobby room to update the lobby players.
   * @see GameManager.emitLobbyUpdate
   */
  LOBBY_PLAYER_UPDATE = "lobbyPlayerUpdate",

  ///////////////////////
  // Game Events //
  ///////////////////////

  /**
   * @description Emitted to the game room to update the game state.
   * @see GameManager.setGameState
   */
  GAME_STATE_UPDATED = "gameStateUpdated",
  GAME_PILE_UPDATED = "gamePileUpdated",
  GAME_SETTINGS_CHANGED = "gameSettingsChanged",
  GAME_STAGE_CHANGED = "gameStageChanged",
  GAME_STARTED = "gameStarted",
  GAME_ENDED = "gameEnded",

  // Player Events
  PLAYER_JOINED_GAME = "playerJoinedGame",
  PLAYER_LEFT_GAME = "playerLeftGame",
  PLAYER_READY = "playerReady",
  PLAYER_NOT_READY = "playerNotReady",

  // Player Actions (Client to Server)
  CHANGE_NAME = "changeName",
  JOIN_GAME = "joinGame",
  CREATE_GAME = "createGame",
  LEAVE_GAME = "leaveGame",
  JOIN_LOBBY = "joinLobby",
  PLAY_CARD = "playCard",
  SLAP_PILE = "slapPile",
  SET_GAME_SETTINGS = "setGameSettings",
  PLAYER_ACTION = "playerAction",

  // Player Action Results (Server to Client)
  CARD_PLAYED = "cardPlayed",
  SLAP_RESULT = "slapResult",
  CHALLENGE_STARTED = "challengeStarted",
  CHALLENGE_RESULT = "challengeResult",
  TURN_CHANGED = "turnChanged",

  // Voting Events
  VOTE_STARTED = "voteStarted",
  VOTE_UPDATED = "voteUpdated",
  VOTE_ENDED = "voteEnded",
  VOTE_RESOLVED = "vote_resolved",

  // Notifications
  ERROR = "error",
  MESSAGE = "message",
}

export interface ISocketPayloads {
  // Connection Events
  [SocketEvents.CONNECT]: undefined;
  [SocketEvents.DISCONNECTING]: undefined;
  [SocketEvents.DISCONNECT]: undefined;

  // Lobby Events
  [SocketEvents.LOBBY_GAME_UPDATE]: LobbyState;
  [SocketEvents.LOBBY_PLAYER_UPDATE]: PlayerInfoUpdate[];

  // Game Events
  [SocketEvents.GAME_STATE_UPDATED]: ClientGameState;
  [SocketEvents.GAME_PILE_UPDATED]: Card[];
  [SocketEvents.GAME_SETTINGS_CHANGED]: GameSettings;
  [SocketEvents.GAME_STAGE_CHANGED]: IGameStageChangedPayload;
  [SocketEvents.GAME_STARTED]: GameStartedPayload;
  [SocketEvents.GAME_ENDED]: GameEndedPayload;

  // Player Events
  [SocketEvents.PLAYER_JOINED_GAME]: PlayerInfo;
  [SocketEvents.PLAYER_LEFT_GAME]: PlayerInfo;
  [SocketEvents.PLAYER_READY]: PlayerInfo;
  [SocketEvents.PLAYER_NOT_READY]: PlayerInfo;

  // Player Actions
  [SocketEvents.CHANGE_NAME]: IChangeNamePayload;
  [SocketEvents.JOIN_GAME]: IJoinGamePayload;
  [SocketEvents.CREATE_GAME]: ICreateGamePayload;
  [SocketEvents.LEAVE_GAME]: ILeaveGamePayload;
  [SocketEvents.JOIN_LOBBY]: IJoinLobbyPayload;
  [SocketEvents.PLAY_CARD]: IPlayCardPayload;
  [SocketEvents.SLAP_PILE]: ISlapPilePayload;
  [SocketEvents.SET_GAME_SETTINGS]: ISetGameSettingsPayload;
  [SocketEvents.PLAYER_ACTION]: PlayerAction;

  // Player Action Results
  [SocketEvents.CARD_PLAYED]: ICardPlayedPayload;
  [SocketEvents.SLAP_RESULT]: ISlapResultPayload;
  [SocketEvents.CHALLENGE_STARTED]: ChallengeStartedPayload;
  [SocketEvents.CHALLENGE_RESULT]: ChallengeResultPayload;
  [SocketEvents.TURN_CHANGED]: TurnChangedPayload;

  // Voting Events
  [SocketEvents.VOTE_STARTED]: VoteState;
  [SocketEvents.VOTE_UPDATED]: VoteState;
  [SocketEvents.VOTE_ENDED]: VoteEndedPayload;
  [SocketEvents.VOTE_RESOLVED]: VoteResolvedPayload;

  // Notifications
  [SocketEvents.ERROR]: string;
  [SocketEvents.MESSAGE]: MessagePayload;
}

// Define payload interfaces
export interface IGameStageChangedPayload {
  previousStage: GameStatus;
  currentStage: GameStatus;
}

export interface IJoinGamePayload {
  roomId: string;
}

// biome-ignore lint/suspicious/noEmptyInterface: Empty interface for create game payload
export interface ICreateGamePayload {}

// biome-ignore lint/suspicious/noEmptyInterface: Empty interface for leave game payload
export interface ILeaveGamePayload {}

// biome-ignore lint/suspicious/noEmptyInterface: Empty interface for join lobby payload
export interface IJoinLobbyPayload {}

export interface IChangeNamePayload {
  name: string;
}

// biome-ignore lint/suspicious/noEmptyInterface: Empty interface for play card payload
export interface IPlayCardPayload {}

export interface ISlapPilePayload {
  playerId: string;
}

export interface ISetGameSettingsPayload {
  settings: GameSettings;
}

export interface IChallengeCounterPayload {
  playerId: string;
}

export interface ICardPlayedPayload {
  playerId: string;
  card: Card;
}

export interface ISlapResultPayload {
  playerId: string;
  result: "valid" | "invalid";
  message?: string;
}

export interface ChallengeStartedPayload {
  challengerId: string;
  challengedId: string;
  remainingCounterChances: number;
}

export interface ChallengeResultPayload {
  winnerId: string;
  loserId: string;
  message?: string;
}

export interface TurnChangedPayload {
  previousPlayerId: string;
  currentPlayerId: string;
}

export interface GameStartedPayload {
  gameId: string;
  players: Array<{
    id: string;
    name: string;
    isBot: boolean;
  }>;
}

export interface GameEndedPayload {
  winner: {
    id: string;
    name: string;
    isBot: boolean;
  };
}

export interface VoteEndedPayload {
  voteResult: boolean;
  voteCount: VoteCount;
}

export interface VoteCount {
  yes: number;
  no: number;
}

export interface VoteResolvedPayload {
  voteResult: boolean;
  voteCount: VoteCount;
}

export interface MessagePayload {
  message: string;
  timestamp: number;
}
