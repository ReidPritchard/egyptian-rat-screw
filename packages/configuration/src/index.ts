const LOG_LEVELS = new Set(["error", "warn", "info", "debug"]);

const SERVER_PORT = 8000;
const CLIENT_PORT = 3000;
const SERVER_WS_URL = `ws://localhost:${SERVER_PORT}`;

export const SETTINGS = {
	SERVER_PORT,
	CLIENT_PORT,
	SERVER_WS_URL,

	LOG_LEVEL: "info",
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
