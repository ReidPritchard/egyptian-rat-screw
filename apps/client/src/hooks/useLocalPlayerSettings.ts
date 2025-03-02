import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { Api } from "../api";
import type { LocalPlayerSettings } from "../clientTypes";
import { newLogger } from "../logger";

const logger = newLogger("LocalPlayerSettings");

// Available theme options
export const THEMES = {
  LIGHT: "light",
  DARK: "synthwave",
};

const DEFAULT_SETTINGS: LocalPlayerSettings = {
  name: "",
  hotkeys: {
    enable: true,
    playCard: "Space",
    slap: "S",
    vote: {
      yes: "Y",
      no: "N",
    },
    ready: "R",
    settings: "Escape",
  },
  ui: {
    actionLog: {
      expanded: false,
    },
    highContrast: false,
    theme: THEMES.LIGHT, // Default to light theme
  },
};

interface ILocalPlayerSettingsState {
  settings: LocalPlayerSettings;
}

interface ILocalPlayerSettingsGetters {
  getTheme: () => string;
}

interface ILocalPlayerSettingsActions {
  updateSettings: (
    newSettings: Partial<LocalPlayerSettings>,
    api: Api | null
  ) => void;
  changeName: (name: string, api: Api | null) => void;
  toggleTheme: () => void;
}

type LocalPlayerSettingsStore = ILocalPlayerSettingsState &
  ILocalPlayerSettingsGetters &
  ILocalPlayerSettingsActions;

export const useLocalPlayerSettings = create<LocalPlayerSettingsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Data
        settings: DEFAULT_SETTINGS,

        // Getters
        getTheme: () => get().settings.ui.theme,

        // Actions
        updateSettings: (
          newSettings: Partial<LocalPlayerSettings>,
          api: Api | null
        ) => {
          logger.info(`Updating settings: ${JSON.stringify(newSettings)}`);
          set((state) => {
            const updatedSettings = { ...state.settings, ...newSettings };

            // If the name has changed, update it on the server
            if (
              newSettings.name &&
              newSettings.name !== state.settings.name &&
              api
            ) {
              api.changeName({ name: newSettings.name });
            }

            return { settings: updatedSettings };
          });
        },

        changeName: (name: string, api: Api | null) => {
          logger.info(`Changing name: ${name}`);
          set((state) => ({
            settings: { ...state.settings, name },
          }));

          if (!api) {
            logger.error("API not initialized, skipping name change");
            return;
          }
          api.changeName({ name });
        },

        toggleTheme: () => {
          set((state) => ({
            settings: {
              ...state.settings,
              ui: {
                ...state.settings.ui,
                theme:
                  state.settings.ui.theme === THEMES.LIGHT
                    ? THEMES.DARK
                    : THEMES.LIGHT,
              },
            },
          }));
        },
      }),
      {
        name: "player-settings",
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
);
