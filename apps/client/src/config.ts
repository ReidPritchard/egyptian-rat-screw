import { SETTINGS } from "@oer/configuration";

export const config = {
	serverUrl: SETTINGS.SERVER_WS_URL,

	localStoragePlayerNameKey: "playerName",
	localStoragePlayerSettingsKey: "playerSettings",

	game: {
		bottomCardDisplayDuration: 3000,
	},
	animation: {
		cardPlayedAnimationDuration: 0.5,
	},
};
