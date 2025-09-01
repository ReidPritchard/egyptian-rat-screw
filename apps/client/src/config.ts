import { SETTINGS } from "@oer/configuration";

// Get env type
let env: string;
let PROD_URL: string;
let PROD_PORT: number | string;

if (typeof process === "undefined" || !process.env) {
  console.warn(
    "process.env is undefined. Defaulting to development environment.",
  );
  env = "development";

  PROD_URL = "ws://localhost";
  PROD_PORT = 8000;
} else {
  env = process.env.NODE_ENV || "development";

  PROD_URL = process.env.WS_URL || SETTINGS.SERVER_WS_URL || "ws://localhost";
  PROD_PORT = process.env.PORT || SETTINGS.SERVER_PORT || 8000;
}

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
