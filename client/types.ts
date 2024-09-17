type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

// Updated SlapRule interface to use structured conditions
export interface Condition {
  field: 'pile.length' | 'pile[0].rank' | 'pile[1].rank' | 'currentPlayer' | 'currentPlayer.name';
  operator: '===' | '!==' | '>' | '<' | '>=' | '<=' | 'in';
  value: string | number | string[];
}

export interface SlapRule {
  name: string;
  conditions: Condition[];
}

export interface GameState {
  id: string;
  name: string;
  maxPlayers: number;
  players: { id: string; name: string }[];
  currentPlayer: number;
  pileSize: number;
  pile: Card[] | null;
  playerHandSizes: { [playerId: string]: number };
  playerNames: { [playerId: string]: string };
  gameOver: boolean;
  winner: { id: string; name: string } | null;
  slapRules: SlapRule[];
}

export interface LobbyState {
  players: { id: string; name: string }[];
  games: { id: string; name: string; playerCount: number; maxPlayers: number }[];
}

export type PlayerActionType = 'playCard' | 'slap' | 'invalidSlap';

export interface PlayerAction {
  playerId: string;
  actionType: PlayerActionType;
  timestamp: number;
}

export type Tab = 'lobby' | 'game';

export interface ClientGameState {
  gameState: GameState | null;
  allSlapRules: SlapRule[];
  lobbyState: LobbyState | null;
  otherPlayers: { id: string; name: string }[];
  lastSlapResult: boolean | null;
  gameId: string;
  animatingCardId: string | null;
  playerName: string;
  errorMessages: string[];
  activeTab: Tab;
  playerActionLog: PlayerAction[];
  isActionLogExpanded: boolean;
  bottomCard: Card | null;
  bottomCardTimer: NodeJS.Timeout | null;
}
