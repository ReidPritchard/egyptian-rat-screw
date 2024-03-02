import { writable } from 'svelte/store';

function createStorageStore(storage: Storage) {
  const { subscribe, set, update } = writable<Record<string, any>>({});

  return {
    subscribe,
    setItem: (key: string, value: any) => {
      try {
        storage.setItem(key, JSON.stringify(value));
        update((store) => ({ ...store, [key]: value }));
      } catch (e) {
        console.error(`Error setting item ${key} to storage`, e);
      }
    },
    getItem: (key: string) => {
      try {
        const value = storage.getItem(key);
        return value ? JSON.parse(value) : null;
      } catch (e) {
        console.error(`Error getting item ${key} from storage`, e);
        return null;
      }
    },
    removeItem: (key: string) => {
      try {
        storage.removeItem(key);
        update((store) => {
          const { [key]: removed, ...rest } = store;
          return rest;
        });
      } catch (e) {
        console.error(`Error removing item ${key} from storage`, e);
      }
    },
    clear: () => {
      try {
        storage.clear();
        set({});
      } catch (e) {
        console.error('Error clearing storage', e);
      }
    },
  };
}

export const localStorageStore = createStorageStore(window.localStorage);
export const sessionStorageStore = createStorageStore(window.sessionStorage);
