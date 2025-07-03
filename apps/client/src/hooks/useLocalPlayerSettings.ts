import { create } from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import type { Api } from "../api";
import type { Hotkey, Hotkeys, LocalPlayerSettings } from "../clientTypes";
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
	enable_hotkeys: true,
	hotkeys: {
		playCard: {
			id: "playCard",
			description: "Play Card",
			key: "N",
			ctrl: false,
			shift: false,
			alt: false,
			meta: false,
		},
		slap: {
			id: "slap",
			description: "Slap Pile",
			key: " ", // Not sure if I should implement a <space> mapping for readability
			ctrl: false,
			shift: false,
			alt: false,
			meta: false,
		},
		vote_yes: {
			id: "voteYes",
			description: "Vote Yes",
			key: "Y",
			ctrl: false,
			shift: false,
			alt: false,
			meta: false,
		},
		vote_no: {
			id: "voteNo",
			description: "Vote No",
			key: "N",
			ctrl: false,
			shift: false,
			alt: false,
			meta: false,
		},
		ready: {
			id: "ready",
			description: "Ready",
			key: "R",
			ctrl: false,
			shift: false,
			alt: false,
			meta: false,
		},
		settings: {
			id: "settings",
			description: "Open Settings",
			key: "Escape",
			ctrl: false,
			shift: false,
			alt: false,
			meta: false,
		},
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
		api: Api | null,
	) => void;
	resetSettings: () => void;
	changeName: (name: string, api: Api | null) => void;
	toggleTheme: () => void;
	saveHotkeys: (hotkeys: Hotkey[]) => void;
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
					api: Api | null,
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

				resetSettings: () => {
					logger.info("Resetting User Settings");
					set(() => ({
						settings: DEFAULT_SETTINGS,
					}));
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

				saveHotkeys: (hotkeys: Hotkey[]) => {
					logger.info(`Saving hotkeys: ${JSON.stringify(hotkeys)}`);
					set((state) => {
						const updatedHotkeys = hotkeys.reduce(
							(acc: Partial<Hotkeys>, hotkey) => {
								const newHotkeyId = hotkey.id as keyof Hotkeys;
								// Make sure the new hotkey maps to an actual binding/setting
								// if it doesn't, log a warning and skip it
								// if it does, add it to the accumulator so it gets saved
								if (newHotkeyId in state.settings.hotkeys) {
									acc[newHotkeyId] = hotkey;
								} else {
									logger.warn(
										`Hotkey with id ${newHotkeyId} does not exist in settings, skipping save`,
									);
								}
								return acc;
							},
							{} as Partial<Hotkeys>,
						);
						return {
							settings: {
								...state.settings,
								hotkeys: {
									...state.settings.hotkeys,
									...updatedHotkeys,
								},
							},
						};
					});
				},
			}),
			{
				name: "player-settings",
				storage: createJSONStorage(() => localStorage),
			},
		),
	),
);
