import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { Api } from "../api";
import type { LocalPlayerSettings } from "../clientTypes";
import { newLogger } from "../logger";

const logger = newLogger("LocalPlayerSettings");

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
  },
};

interface ILocalPlayerSettingsState {
  settings: LocalPlayerSettings;
}

interface ILocalPlayerSettingsActions {
  updateSettings: (
    newSettings: Partial<LocalPlayerSettings>,
    api: Api | null
  ) => void;
  changeName: (name: string, api: Api | null) => void;
}

type LocalPlayerSettingsStore = ILocalPlayerSettingsState &
  ILocalPlayerSettingsActions;

export const useLocalPlayerSettings = create<LocalPlayerSettingsStore>()(
  devtools(
    persist(
      (set) => ({
        settings: DEFAULT_SETTINGS,

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
      }),
      {
        name: "player-settings",
        storage: createJSONStorage(() => localStorage),
      }
    )
  )
);
