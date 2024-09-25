const LOG_LEVELS = new Set(['error', 'warn', 'info', 'debug']);

export const SETTINGS = {
  PORT: process.env.PORT || 3000,
  LOG_LEVEL: process.env.LOG_LEVEL || LOG_LEVELS.values(),
  LOBBY_ROOM: 'lobby',

  GENERATORS: {
    GAME_ID: {
      ADJECTIVES: ['quick', 'lazy', 'sleepy', 'noisy', 'hungry', 'thirsty', 'silly', 'serious', 'cool', 'hot'],
      NOUNS: ['apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'honeydew', 'kiwi', 'lemon'],
    },
    PLAYER_NAME: {
      ADJECTIVES: ['quick', 'lazy', 'sleepy', 'noisy', 'hungry', 'thirsty', 'silly', 'serious', 'cool', 'hot'],
      NOUNS: [
        'John',
        'Jane',
        'Smith',
        'Emily',
        'Poe',
        'Sally',
        'Everdeen',
        'Peeta',
        'Katniss',
        'Harry',
        'Ron',
        'Hermione',
        'Draco',
        'Ginny',
        'Luna',
        'Neville',
        'Fred',
        'George',
      ],
    },
  },
};
