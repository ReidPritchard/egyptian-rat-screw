import { Rank } from '../types';

export function isFaceCard(rank: Rank): boolean {
  return ['J', 'Q', 'K', 'A'].includes(rank);
}

export function getFaceCardChances(rank: Rank): number {
  const chances = { A: 4, K: 3, Q: 2, J: 1 };
  return chances[rank as keyof typeof chances];
}

export function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
