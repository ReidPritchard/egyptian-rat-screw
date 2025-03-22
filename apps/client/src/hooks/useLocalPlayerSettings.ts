import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { Api } from "../api";
import type { Hotkeys, LocalPlayerSettings } from "../clientTypes";
import { newLogger } from "../logger";

const logger = newLogger("LocalPlayerSettings");

// Available theme options
export const THEMES = {
  LIGHT: "light",
  DARK: "sunset",
  // SYNTHWAVE: "synthwave",
  // CUPCAKE: "cupcake",
  // BUMBLEBEE: "bumblebee",
  // EMERALD: "emerald",
  // CORPORATE: "corporate",
  // RETRO: "retro",
  // CYBERPUNK: "cyberpunk",
  // VALENTINE: "valentine",
  // HALLOWEEN: "halloween",
  // GARDEN: "garden",
  // FOREST: "forest",
  // AQUA: "aqua",
  // LOFI: "lofi",
  // PASTEL: "pastel",
  // FANTASY: "fantasy",
  // WIREFRAME: "wireframe",
  // BLACK: "black",
  // LUXURY: "luxury",
  // DRACULA: "dracula",
  // CMYK: "cmyk",
  // AUTUMN: "autumn",
  // BUSINESS: "business",
  // ACID: "acid",
  // LEMONADE: "lemonade",
  // NIGHT: "night",
  // COFFEE: "coffee",
  // WINTER: "winter",
  // SUNSET: "sunset",
  // CARAMELLATTE: "caramellatte",
  // ABYSS: "abyss",
  // SILK: "silk",
  // DIM: "dim",
  // NORD: "nord",
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
  getHotkeys: () => Hotkeys;
}

interface ILocalPlayerSettingsActions {
  updateSettings: (
    newSettings: Partial<LocalPlayerSettings>,
    api: Api | null
  ) => void;
  changeName: (name: string, api: Api | null) => void;
  toggleTheme: () => void;
  saveHotkeys: (hotkeys: Hotkeys) => void;
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
        getHotkeys: () => get().settings.hotkeys,

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

        saveHotkeys: (hotkeys: Hotkeys) => {
          set((state) => ({
            settings: { ...state.settings, hotkeys },
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
