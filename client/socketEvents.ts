import {
  Card,
  ClientGameState,
  GameSettings,
  GameStage,
  LobbyState,
  PlayerAction,
  PlayerInfo,
  VoteState,
} from './types';

/**
 * @enum SocketEvents
 * @description Centralizes all socket event names and their corresponding types.
 */
export enum SocketEvents {
  // Connection Events
  CONNECT = 'connect',
  DISCONNECTING = 'disconnecting',
  DISCONNECT = 'disconnect',

  // Lobby Events
  LOBBY_UPDATE = 'lobbyUpdate',
  PLAYER_NAME_CHANGED = 'playerNameChanged',
  PLAYER_JOINED_LOBBY = 'playerJoinedLobby',
  PLAYER_LEFT_LOBBY = 'playerLeftLobby',

  // Game Events
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
  PLAYER_ACTION = 'playerAction',
  SET_GAME_SETTINGS = 'setGameSettings',

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
  [SocketEvents.LOBBY_UPDATE]: LobbyState;
  [SocketEvents.PLAYER_NAME_CHANGED]: PlayerInfo;
  [SocketEvents.PLAYER_JOINED_LOBBY]: PlayerInfo;
  [SocketEvents.PLAYER_LEFT_LOBBY]: PlayerInfo;

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
