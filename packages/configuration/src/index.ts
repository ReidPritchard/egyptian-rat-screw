// Application Environment

const supported_envs = {
  development: "development",
  production: "production",
  test: "test",
};
type SupportedEnv = keyof typeof supported_envs;

const getAppEnv = (): SupportedEnv => {
  let env: string;

  if (typeof process === "undefined" || !process.env) {
    console.warn(
      "process.env is undefined. Defaulting to development environment.",
    );
    env = supported_envs.development;
  } else {
    // Default to development if APP_ENV is not set
    env = process.env.APP_ENV || supported_envs.development;
  }

  if (
    env === "prod" ||
    env === "release" ||
    env === "deploy" ||
    env === "production"
  ) {
    env = supported_envs.production;
  } else if (env === "test") {
    env = supported_envs.test;
  } else if (env === "dev" || env === "local" || env === "development") {
    env = supported_envs.development;
  } else {
    throw new Error(`Unsupported environment: ${env}`);
  }

  return env as SupportedEnv;
};

export const APP_ENV: SupportedEnv = getAppEnv();

// Logging Configuration

type LogLevel = "error" | "warn" | "info" | "debug";
const LOG_LEVELS: { [key in LogLevel]: LogLevel } = {
  error: "error",
  warn: "warn",
  info: "info",
  debug: "debug",
};

// Application Configuration

const SERVER_PORT = 8000;
const CLIENT_PORT = 3000;

// TODO: Change url based on env?
// I think we will need to use "ws://egyptian-rat-screw.onrender.com" for prod, but
// not sure since the ws server is attached to the same url as the app server
const WS_SERVER_URL = `ws://localhost:${SERVER_PORT}`;

export const SETTINGS = {
  SERVER_PORT,
  CLIENT_PORT,
  WS_SERVER_URL,

  LOG_LEVEL: LOG_LEVELS.info,
  LOG_ALIGNMENT: 25,
  LOBBY_ROOM: "lobby",

  GENERATORS: {
    GAME_ID: {
      ADJECTIVES: [
        "quick",
        "lazy",
        "sleepy",
        "noisy",
        "hungry",
        "thirsty",
        "silly",
        "serious",
        "cool",
        "hot",
      ],
      NOUNS: [
        "apple",
        "banana",
        "cherry",
        "date",
        "elderberry",
        "fig",
        "honeydew",
        "kiwi",
        "lemon",
      ],
    },
    PLAYER_NAME: {
      ADJECTIVES: [
        "quick",
        "lazy",
        "sleepy",
        "noisy",
        "hungry",
        "thirsty",
        "silly",
        "serious",
        "cool",
        "hot",
      ],
      NOUNS: [
        "john",
        "jane",
        "smith",
        "emily",
        "poe",
        "sally",
        "everdeen",
        "peeta",
        "katniss",
        "harry",
        "ron",
        "hermione",
        "draco",
        "ginny",
        "luna",
        "neville",
        "fred",
        "george",
      ],
    },
  },
};
