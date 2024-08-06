import { writable } from 'svelte/store';

const game = writable({
  game: {
    state: 'lobby',
    room: '',
    players: [],
    host: '',
    winner: '',
    board: Array(9).fill(''),
    turn: '',
    message: '',
  },
});

const createGameStore = () => {
  const setProperty = (property, value) => {
    game.update((g) => {
      g.game[property] = value;
      return g;
    });
  };

  return {
    set: game.set,
    subscribe: game.subscribe,
    setState: (state) => setProperty('state', state),
    setRoom: (room) => setProperty('room', room),
    setPlayers: (players) => setProperty('players', players),
    setHost: (host) => setProperty('host', host),
    setWinner: (winner) => setProperty('winner', winner),
    setBoard: (board) => setProperty('board', board),
    setTurn: (turn) => setProperty('turn', turn),
    setMessage: (message) => setProperty('message', message),
  };
};

export const gameStore = createGameStore();
