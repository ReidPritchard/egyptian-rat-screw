import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  connectDatabaseEmulator,
  ref,
  get,
  query,
  orderByChild,
  equalTo,
  set,
  update,
} from 'firebase/database';
import { firebaseConfig } from '../config';
import type { Game } from '../resources/db-interfaces';

const setupFirebase = () => {
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);

  if (import.meta.env.DEV) {
    connectDatabaseEmulator(database, 'localhost', 9000);
  }

  return { app, database };
};

const { app, database } = setupFirebase();

export const doesUsernameExist = async (username: string): Promise<boolean> => {
  console.log(`Checking if username "${username}" exists...`);

  try {
    // Reference to the 'players' collection in the database
    const playersRef = ref(database, 'players');

    // Query the 'players' collection for the username
    const dbQuery = query(
      playersRef,
      orderByChild('username'),
      equalTo(username)
    );

    // Get a snapshot of the query result
    const snapshot = await get(dbQuery);

    // Check if the username exists in the players collection
    const exists = snapshot.exists();

    console.log(
      `Username "${username}" ${exists ? 'found' : 'not found'} in the database.`
    );
    return exists;
  } catch (error) {
    console.error(`Failed to check if username "${username}" exists:`, error);
    throw error;
  }
};

export const createGame = async (): Promise<string> => {
  console.log('Creating a new game...');

  try {
    // TODO: Actually check if the id is unique
    const gameId = 'game-' + Math.random().toString(36).substr(2, 9);

    const newGame: Game = {
      gameId,
      players: [],
      currentPlayer: 0,
      currentChances: 0,
      centralPile: [],
      playerHands: {},
      slapRules: [],
      slapPenalty: '',
      gameState: 'waiting',
    };

    // Push a new game object to the 'games' collection
    await set(ref(database, 'games/' + gameId), newGame);

    // Get the key of the newly created game object
    console.log('New game created successfully.');

    return gameId;
  } catch (error) {
    console.error('Failed to create a new game:', error);
    throw error;
  }
};

export const joinGame = async (
  gameId: string,
  playerId: string
): Promise<void> => {
  console.log(`Player "${playerId}" joining game "${gameId}"...`);

  try {
    // Get the game object from the 'games' collection
    const gameSnapshot = await get(ref(database, 'games/' + gameId));

    if (!gameSnapshot.exists()) {
      throw new Error(`Game "${gameId}" not found.`);
    }

    const game = gameSnapshot.val() as Game;

    const updates: { [key: string]: any } = {};
    // Game Updates
    updates['games/' + gameId + '/players'] = [
      ...(game.players || []),
      playerId,
    ];
    // An empty array will be removed by Firebase, so we shouldn't bother setting it
    // updates['games/' + gameId + '/playerHands/' + playerId] = [];

    // Player List Updates
    updates['players/' + playerId] = {
      username: playerId,
      connected: true,
      ready: false,
    };

    await update(ref(database), updates);

    console.log(`Player "${playerId}" joined game "${gameId}" successfully.`);
  } catch (error) {
    console.error(`Failed to join game "${gameId}":`, error);
    throw error;
  }
};

export const getGameReference = async (gameId: string) => {
  return ref(database, 'games/' + gameId);
}

