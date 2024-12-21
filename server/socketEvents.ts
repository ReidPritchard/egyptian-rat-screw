import {
  Card,
  ClientGameState,
  GameSettings,
  GameStage,
  LobbyState,
  PlayerAction,
  PlayerInfo,
  PlayerInfoUpdate,
  VoteState,
} from './types';

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
  CONNECT = 'connect',

  /**
   * @description Used by the server to clean up client related state when they
   * disconnect.
   */
  DISCONNECTING = 'disconnecting',

  /**
   * @description Used by both the client and server when disconnected
   */
  DISCONNECT = 'disconnect',

  ///////////////////////
  // Lobby Events //
  ///////////////////////

  /**
   * @description Emitted to the lobby room to update the active games.
   * @see GameManager.emitLobbyUpdate
   */
  LOBBY_GAME_UPDATE = 'lobbyGameUpdate',

  /**
   * @description Emitted to the lobby room to update the lobby players.
   * @see GameManager.emitLobbyUpdate
   */
  LOBBY_PLAYER_UPDATE = 'lobbyPlayerUpdate',

  ///////////////////////
  // Game Events //
  ///////////////////////

  /**
   * @description Emitted to the game room to update the game state.
   * @see GameManager.setGameState
   */
  GAME_STATE_UPDATED = 'gameStateUpdated',
  GAME_PILE_UPDATED = 'gamePileUpdated',
  GAME_SETTINGS_CHANGED = 'gameSettingsChanged',
  GAME_STAGE_CHANGED = 'gameStageChanged',
  GAME_STARTED = 'gameStarted',
  GAME_ENDED = 'gameEnded',

  // Player Events
  PLAYER_JOINED_GAME = 'playerJoinedGame',
  PLAYER_LEFT_GAME = 'playerLeftGame',
  PLAYER_READY = 'playerReady',
  PLAYER_NOT_READY = 'playerNotReady',

  // Player Actions (Client to Server)
  CHANGE_NAME = 'changeName',
  JOIN_GAME = 'joinGame',
  CREATE_GAME = 'createGame',
  LEAVE_GAME = 'leaveGame',
  JOIN_LOBBY = 'joinLobby',
  PLAY_CARD = 'playCard',
  SLAP_PILE = 'slapPile',
  SET_GAME_SETTINGS = 'setGameSettings',
  PLAYER_ACTION = 'playerAction',

  // Player Action Results (Server to Client)
  CARD_PLAYED = 'cardPlayed',
  SLAP_RESULT = 'slapResult',
  CHALLENGE_STARTED = 'challengeStarted',
  CHALLENGE_RESULT = 'challengeResult',
  TURN_CHANGED = 'turnChanged',

  // Voting Events
  VOTE_STARTED = 'voteStarted',
  VOTE_UPDATED = 'voteUpdated',
  VOTE_ENDED = 'voteEnded',

  // Notifications
  ERROR = 'error',
  MESSAGE = 'message',
}

export interface SocketPayloads {
  // Connection Events
  [SocketEvents.CONNECT]: void;
  [SocketEvents.DISCONNECTING]: void;
  [SocketEvents.DISCONNECT]: void;

  // Lobby Events
  [SocketEvents.LOBBY_GAME_UPDATE]: LobbyState;
  [SocketEvents.LOBBY_PLAYER_UPDATE]: PlayerInfoUpdate[];

  // Game Events
  [SocketEvents.GAME_STATE_UPDATED]: ClientGameState;
  [SocketEvents.GAME_PILE_UPDATED]: Card[];
  [SocketEvents.GAME_SETTINGS_CHANGED]: GameSettings;
  [SocketEvents.GAME_STAGE_CHANGED]: GameStageChangedPayload;
  [SocketEvents.GAME_STARTED]: GameStartedPayload;
  [SocketEvents.GAME_ENDED]: GameEndedPayload;

  // Player Events
  [SocketEvents.PLAYER_JOINED_GAME]: PlayerInfo;
  [SocketEvents.PLAYER_LEFT_GAME]: PlayerInfo;
  [SocketEvents.PLAYER_READY]: PlayerInfo;
  [SocketEvents.PLAYER_NOT_READY]: PlayerInfo;

  // Player Actions
  [SocketEvents.CHANGE_NAME]: ChangeNamePayload;
  [SocketEvents.JOIN_GAME]: JoinGamePayload;
  [SocketEvents.CREATE_GAME]: CreateGamePayload;
  [SocketEvents.LEAVE_GAME]: LeaveGamePayload;
  [SocketEvents.JOIN_LOBBY]: JoinLobbyPayload;
  [SocketEvents.PLAY_CARD]: PlayCardPayload;
  [SocketEvents.SLAP_PILE]: SlapPilePayload;
  [SocketEvents.PLAYER_ACTION]: PlayerAction;

  // Player Action Results
  [SocketEvents.CARD_PLAYED]: CardPlayedPayload;
  [SocketEvents.SLAP_RESULT]: SlapResultPayload;
  [SocketEvents.CHALLENGE_STARTED]: ChallengeStartedPayload;
  [SocketEvents.CHALLENGE_RESULT]: ChallengeResultPayload;
  [SocketEvents.TURN_CHANGED]: TurnChangedPayload;

  // Voting Events
  [SocketEvents.VOTE_STARTED]: VoteState;
  [SocketEvents.VOTE_UPDATED]: VoteState;
  [SocketEvents.VOTE_ENDED]: VoteEndedPayload;

  // Notifications
  [SocketEvents.ERROR]: string;
  [SocketEvents.MESSAGE]: MessagePayload;
}

// Define payload interfaces
export interface GameStageChangedPayload {
  previousStage: GameStage;
  currentStage: GameStage;
}

export interface JoinGamePayload {
  gameId: string;
}

export interface CreateGamePayload {}

export interface LeaveGamePayload {}

export interface JoinLobbyPayload {}

export interface ChangeNamePayload {
  name: string;
}

export interface PlayCardPayload {}

export interface SlapPilePayload {
  playerId: string;
}

export interface ChallengeCounterPayload {
  playerId: string;
}

export interface CardPlayedPayload {
  playerId: string;
  card: Card;
}

export interface SlapResultPayload {
  playerId: string;
  result: 'valid' | 'invalid';
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
  startTime: number;
}

export interface GameEndedPayload {
  winner: PlayerInfo | null;
}

export interface VoteEndedPayload {
  voteResult: boolean;
  voteCount: VoteCount;
}

export interface VoteCount {
  yes: number;
  no: number;
}

export interface MessagePayload {
  message: string;
  timestamp: number;
}
