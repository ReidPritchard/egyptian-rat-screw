export enum GameStates {
  NotStarted,
  InProgress,
  Paused,
  Ended,
}

export interface Score {
  playerName: string;
  score: number;
}
