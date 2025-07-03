/**
 * @file shared/types.ts
 * @description Consolidates all shared TypeScript types for both client and server.
 */

///////// CARD TYPES /////////

export const Suits = ["hearts", "diamonds", "clubs", "spades"] as const;
export type Suit = (typeof Suits)[number];

export const Ranks = [
	"A",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"8",
	"9",
	"10",
	"J",
	"Q",
	"K",
] as const;
export type Rank = (typeof Ranks)[number];

export interface Card {
	id: string;
	code: string;
	suit: Suit;
	rank: Rank;
}

///////// PLAYER TYPES /////////

export interface PlayerInfo {
	id: string;
	name: string;
	isBot: boolean;
}

export enum PlayerInfoAction {
	JOIN = "join",
	LEAVE = "leave",
	UPDATE = "update",
}

export type PlayerInfoUpdate = PlayerInfo & {
	action: PlayerInfoAction;
};

export enum PlayerStatus {
	ACTIVE = "active",
	ELIMINATED = "eliminated",
	AWAY = "away",
	READY = "ready",
	NOT_READY = "not-ready",
	UNKNOWN = "unknown",
}

export enum PlayerActionType {
	START_VOTE = "start-vote",
	CAST_VOTE = "cast-vote",
	SET_READY = "set-ready",
	SET_SETTINGS = "set-settings",
}

export interface PlayerAction {
	playerId: string;
	actionType: PlayerActionType;
	timestamp: number;
	data: {
		vote?: boolean;
		voteTopic?: string;
		ready?: boolean;
		settings?: GameSettings;
	};
}

export interface PlayerActionResult {
	playerId: string;
	actionType: PlayerActionType;
	result: "success" | "failure";
	message?: string;
	timestamp: number;
}

///////// GAME ACTION TYPES /////////

// Types of actions that occur during the game, used for logging
// and to calculate game statistics
export enum GameActionType {
	ADD_PLAYER = "ADD_PLAYER",
	REMOVE_PLAYER = "REMOVE_PLAYER",
	START_GAME = "START_GAME",
	END_GAME = "END_GAME",
	PLAY_CARD = "PLAY_CARD",
	VALID_SLAP = "VALID_SLAP",
	INVALID_SLAP = "INVALID_SLAP",
	START_CHALLENGE = "START_CHALLENGE",
	COUNTER_FACE_CARD_CHALLENGE = "COUNTER_FACE_CARD_CHALLENGE",
	WIN_FACE_CARD_CHALLENGE = "WIN_FACE_CARD_CHALLENGE",
	LOSE_FACE_CARD_CHALLENGE = "LOSE_FACE_CARD_CHALLENGE",
	ADVANCE_TURN = "ADVANCE_TURN",
	SET_READY = "SET_READY",
	SET_SETTINGS = "SET_SETTINGS",
	START_VOTE = "START_VOTE",
	SUBMIT_VOTE = "SUBMIT_VOTE",
	RESOLVE_VOTE = "RESOLVE_VOTE",
}

export interface GameAction {
	playerId: string;
	eventType: GameActionType;
	timestamp: number;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	data: any;
}

///////// GAME RULE TYPES /////////

export interface ICondition {
	field: ConditionValue;
	operator: "===" | "!==" | ">" | "<" | ">=" | "<=" | "in";
	value: ConditionValue;
}

export interface IDynamicValue {
	value: string;
	isDynamic: true;
}

export interface IStaticValue {
	value: string | number | string[];
	isDynamic: false;
}

export type ConditionValue = IDynamicValue | IStaticValue;

export enum SlapRuleAction {
	TAKE_PILE = "take-pile",
	SKIP = "skip",
	DRINK = "drink",
	DRINK_ALL = "drink-all",
}

export interface SlapRule {
	// The name of the rule (used so users know why it was valid/invalid)
	name: string;
	// The conditions that must be met for the rule to be triggered
	conditions: ICondition[];
	// The action to be taken when the rule is triggered
	// The action can be negative or positive, depending on the context
	// a positive action is applied to the slapper, while a negative action is applied to the target player
	// skip: The target player must skip their next turn
	// drink: The target player must take a drink
	// take-pile: The slapper gets to take all the cards in the pile
	action: SlapRuleAction;
	// The name of the player to be targeted by the rule
	targetPlayerName?: string;
}

///////// GAME STATE TYPES /////////

export interface GameSettings {
	minimumPlayers: number;
	maximumPlayers: number;
	slapRules: SlapRule[];
	faceCardChallengeCounts: { [key: string]: number };
	/**
	 * Partial<Card> allows for a Card object with missing properties,
	 * which are treated as wild for the purpose of matching
	 */
	challengeCounterCards: Partial<Card>[];
	turnTimeout: number;
	/**
	 * The amount of time a "completed" challenge can be slapped before
	 * the game will automatically count the challenge as successful
	 *
	 * This allows any player to slap before the cards are removed due to the
	 * resolved challenge.
	 */
	challengeCounterSlapTimeout: number;
}

export interface FaceCardSequence {
	initiator: PlayerInfo;
	activePlayerId: string;
	faceCardRank: Rank;
	cardsToPlay: number;
	cardsPlayed: number;
}

export interface SlappingRecord {
	playerId: string;
	slaps: number;
}

export interface ServerGameState {
	gameId: string;
	name: string;
	players: PlayerInfo[];
	currentPlayerIndex: number;
	centralPile: Card[] | null;
	status: GameStatus;
	faceCardSequence: FaceCardSequence | null;
	lastAction: GameAction | null;
	lastActionTimestamp: number;
	winningSlaps: SlappingRecord[];
	settings: GameSettings;
	createdAt: Date;
	updatedAt: Date;
	winner: PlayerInfo | null;
}

export enum GameStatus {
	WAITING_FOR_PLAYERS = "waiting_for_players",
	PRE_GAME = "pre-game",
	STARTING = "starting",
	IN_PROGRESS = "in_progress",
	FACE_CARD_SEQUENCE = "face_card_sequence",
	SLAPPING_WINDOW = "slapping_window",
	PLAYING = "playing",
	VOTING = "voting",
	PAUSED = "paused",
	RESTARTING = "restarting",
	COMPLETED = "completed",
	CANCELLED = "cancelled",
	GAME_OVER = "game-over",
}

export const GameStatusCategories: Record<string, GameStatus[]> = {
	PRE_GAME: [
		GameStatus.WAITING_FOR_PLAYERS,
		GameStatus.PRE_GAME,
		GameStatus.STARTING,
	],
	IN_GAME: [
		GameStatus.PLAYING,
		GameStatus.VOTING,
		GameStatus.PAUSED,
		GameStatus.RESTARTING,
	],
	POST_GAME: [GameStatus.COMPLETED, GameStatus.GAME_OVER],
	CANCELLED: [GameStatus.CANCELLED],
} as const;

///////// CLIENT STATE TYPES /////////

export interface ClientPlayerInfo {
	id: string;
	name: string;
	cardCount: number;
	status: PlayerStatus;
	isBot: boolean;
}

// A subset of GameState that is sent to the client
// This is used to reduce the amount of data sent to the client
// and to prevent the client from having full access to the game state
export interface ClientGameState {
	gameId: string;
	status: GameStatus;
	players: ClientPlayerInfo[];
	currentPlayerId: string;
	centralPileCount: number;
	centralPile: Card[];
	faceCardChallenge: FaceCardSequence | null;
	winner: PlayerInfo | null;
	voteState: VoteState | null;
	settings: GameSettings;
	eventLog: GameAction[];
}

export interface LobbyState {
	games: {
		id: string;
		name: string;
		playerCount: number;
		maxPlayers: number;
	}[];
}

///////// VOTING TYPES /////////

export interface Vote {
	playerId: string;
	vote: boolean;
}

export interface VoteState {
	topic: string;
	votes: Vote[];
	startTime: number;
}
