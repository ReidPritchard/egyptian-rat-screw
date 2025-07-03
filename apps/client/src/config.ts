import { SETTINGS } from "@oer/configuration";

// Get env type
const env = process.env.NODE_ENV;

const PROD_URL = process.env.WS_URL;
const PROD_PORT = process.env.PORT || SETTINGS.SERVER_PORT || 8000;

export const config = {
	serverUrl:
		env !== "production" ? SETTINGS.SERVER_WS_URL : `${PROD_URL}:${PROD_PORT}`,

	localStoragePlayerNameKey: "playerName",
	localStoragePlayerSettingsKey: "playerSettings",

	game: {
		bottomCardDisplayDuration: 3000,
	},
	animation: {
		cardPlayedAnimationDuration: 0.5,
	},
};
