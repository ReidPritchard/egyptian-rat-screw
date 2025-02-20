import { SETTINGS } from "@oer/configuration";
import type { MessageServer } from "../message/messageServer.js";

//////////////////
// Generators
//////////////////

export function generateGameId(messageServer: MessageServer): string {
  const nouns = SETTINGS.GENERATORS.GAME_ID.NOUNS;
  const adjectives = SETTINGS.GENERATORS.GAME_ID.ADJECTIVES;

  let gameId: string;
  do {
    // Generate a random game ID
    gameId = `${adjectives[Math.floor(Math.random() * adjectives.length)]}-${
      nouns[Math.floor(Math.random() * nouns.length)]
    }`;
  } while (messageServer.getRoom(gameId) !== undefined); // Check if the ID already exists

  return gameId;
}

export function generatePlayerName(): string {
  const adjectives = SETTINGS.GENERATORS.PLAYER_NAME.ADJECTIVES;
  const names = SETTINGS.GENERATORS.PLAYER_NAME.NOUNS;
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
    names[Math.floor(Math.random() * names.length)]
  }`;
}
