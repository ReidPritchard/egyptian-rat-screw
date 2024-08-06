import { writable } from 'svelte/store';
import { type FirebaseApp, initializeApp } from 'firebase/app';
import {
  getDatabase,
  connectDatabaseEmulator,
  Database,
} from 'firebase/database';
import { firebaseConfig } from '../config';

export interface ISession {
  player_id: string;
  username: string;
  room_id: string;
  room_name: string;
  firebase: {
    app: FirebaseApp | null;
    auth: any | null; // Replace 'any' with the appropriate Firebase Auth type
    database: Database | null;
  };
}

const session = writable<ISession>({
  player_id: '',
  username: '',
  room_id: '',
  room_name: '',
  firebase: {
    app: null,
    auth: null,
    database: null,
  },
});

const createSessionStore = () => {
  const app = initializeApp(firebaseConfig);
  const database = getDatabase(app);

  if (import.meta.env.DEV) {
    connectDatabaseEmulator(database, 'localhost', 9000);
  }

  const setProperty = <K extends keyof ISession>(
    property: K,
    value: ISession[K]
  ) => {
    session.update((s) => {
      s[property] = value;
      return s;
    });
  };

  setProperty('firebase', { app, auth: null, database });

  return {
    set: session.set,
    subscribe: session.subscribe,
    setPlayerId: (player_id: string) => setProperty('player_id', player_id),
    setUsername: (username: string) => setProperty('username', username),
    setRoomId: (room_id: string) => setProperty('room_id', room_id),
    setRoomName: (room_name: string) => setProperty('room_name', room_name),
    setFirebaseApp: (app: FirebaseApp) => setProperty('firebase.app', app),
    setFirebaseAuth: (auth: any) => setProperty('firebase.auth', auth), // Replace 'any' with the appropriate Firebase Auth type
    setFirebaseDatabase: (database: Database) =>
      setProperty('firebase.database', database),
  };
};

export const sessionStore = createSessionStore();
