// Custom hook to get and set the player's settings

import { useLocalStorage } from '@mantine/hooks';
import { LocalPlayerSettings } from '../clientTypes';
import { api } from '../api';

const DEFAULT_SETTINGS: LocalPlayerSettings = {
  name: '', // If the player's name is empty, the server will assign a random name
  hotkeys: {
    enable: true,
    playCard: 'Space',
    slap: 'S',
    vote: {
      yes: 'Y',
      no: 'N',
    },
    ready: 'R',
    settings: 'Escape',
  },
  ui: {
    actionLog: {
      expanded: false,
    },
  },
};

export function useLocalPlayerSettings() {
  const [settings, setSettings] = useLocalStorage<LocalPlayerSettings>({
    key: 'localPlayerSettings',
    defaultValue: DEFAULT_SETTINGS,
  });

  const updateSettings = (newSettings: Partial<LocalPlayerSettings>) => {
    setSettings((prevSettings) => {
      const updatedSettings = { ...prevSettings, ...newSettings };

      // If the name has changed, update it on the server
      if (newSettings.name && newSettings.name !== prevSettings.name) {
        api.changeName({ name: newSettings.name });
      }

      return updatedSettings;
    });
  };

  const changeName = (name: string) => {
    updateSettings({ name });
  };

  return {
    settings,
    updateSettings,
    changeName,
  };
}
