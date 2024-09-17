import { Server, Socket } from 'socket.io';
import { SlapRule } from './game/types';

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('A user connected');

    socket.on('joinLobby', (playerName: string) => handleJoinLobby(socket, io, playerName));
    socket.on('createGame', () => handleCreateGame(socket, io));
    socket.on('joinGame', (gameId: string) => handleJoinGame(socket, io, gameId));
    socket.on('leaveGame', () => handleLeaveGame(socket, io));
    socket.on('playCard', () => handlePlayCard(socket, io));
    socket.on('slap', () => handleSlap(socket, io));
    socket.on('updatePlayerName', (newName: string) => handleUpdatePlayerName(socket, io, newName));
    socket.on('restartGame', () => handleRestartGame(socket, io));
    socket.on('updateGameSettings', (gameId: string, settings: { maxPlayers?: number; slapRules?: SlapRule[] }) =>
      handleUpdateGameSettings(socket, io, gameId, settings),
    );
    socket.on('disconnect', () => handleDisconnect(socket, io));
  });
}

function handleJoinLobby(socket: Socket, io: Server, playerName: string) {
  const playerId = socket.id;
  lobby.addPlayer(playerId, playerName);
  socket.join('lobby');
  io.to('lobby').emit('lobbyUpdate', lobby.getState());
}

function handleCreateGame(socket: Socket, io: Server) {
  const playerId = socket.id;
  const game = gameManager.createGame(playerId);
  if (game) {
    socket.join(game.id);
    io.to(game.id).emit('gameCreated', game.getGameState());
    io.to('lobby').emit('lobbyUpdate', lobby.getState());
  } else {
    socket.emit('error', 'Failed to create game');
  }
}

function handleJoinGame(socket: Socket, io: Server, gameId: string) {
  const playerId = socket.id;
  const game = gameManager.joinGame(playerId, gameId);
  if (game) {
    socket.join(gameId);
    io.to(gameId).emit('gameUpdate', game.getGameState());
    io.to('lobby').emit('lobbyUpdate', lobby.getState());
    socket.emit('gameSettings', game.getDefaultSlapRules());
  } else {
    socket.emit('error', 'Failed to join game. The game might be full or not exist.');
  }
}

function handleLeaveGame(socket: Socket, io: Server) {
  const playerId = socket.id;
  const { game, playerName } = gameManager.leaveGame(playerId);
  if (game) {
    socket.leave(game.id);
    if (game.players.length === 0) {
      lobby.games.delete(game.id);
    } else {
      io.to(game.id).emit('gameUpdate', game.getGameState());
    }
  }
  lobby.addPlayer(playerId, playerName);
  socket.join('lobby');
  io.to('lobby').emit('lobbyUpdate', lobby.getState());
}

function handlePlayCard(socket: Socket, io: Server) {
  const playerId = socket.id;
  const game = gameManager.findGameByPlayerId(playerId);
  if (game) {
    try {
      game.playCard(playerId);
      const gameState = game.getGameState();
      io.to(game.id).emit('gameUpdate', gameState);
      io.to(game.id).emit('playerAction', { playerId, actionType: 'playCard', timestamp: Date.now() });
      if (gameState.gameOver) {
        io.to(game.id).emit('gameOver', gameState);
      }
    } catch (error) {
      socket.emit('error', (error as Error).message);
    }
  }
}

function handleSlap(socket: Socket, io: Server) {
  const playerId = socket.id;
  const game = gameManager.findGameByPlayerId(playerId);
  if (game) {
    const isValidSlap = game.checkSlap(playerId);
    const gameState = game.getGameState();
    io.to(game.id).emit('gameUpdate', gameState);
    socket.emit('slapResult', isValidSlap);
    io.to(game.id).emit('playerAction', {
      playerId,
      actionType: isValidSlap ? 'slap' : 'invalidSlap',
      timestamp: Date.now(),
    });
    if (gameState.gameOver) {
      io.to(game.id).emit('gameOver', gameState);
    }
  }
}

function handleUpdatePlayerName(socket: Socket, io: Server, newName: string) {
  const playerId = socket.id;
  const game = gameManager.findGameByPlayerId(playerId);
  if (game) {
    game.updatePlayerName(playerId, newName);
    io.to(game.id).emit('gameUpdate', game.getGameState());
  } else {
    lobby.updatePlayerName(playerId, newName);
    io.to('lobby').emit('lobbyUpdate', lobby.getState());
  }
}

function handleRestartGame(socket: Socket, io: Server) {
  const playerId = socket.id;
  const game = gameManager.findGameByPlayerId(playerId);
  if (game) {
    game.restartGame();
    io.to(game.id).emit('gameUpdate', game.getGameState());
  }
}

function handleUpdateGameSettings(
  socket: Socket,
  io: Server,
  gameId: string,
  settings: { maxPlayers?: number; slapRules?: SlapRule[] },
) {
  const game = lobby.games.get(gameId);
  if (game) {
    if (settings.maxPlayers && (settings.maxPlayers < 2 || settings.maxPlayers > 8)) {
      socket.emit('error', 'Invalid max players value. It must be between 2 and 8.');
      return;
    }
    if (settings.slapRules) {
      const selectedRules = settings.slapRules.filter((rule): rule is SlapRule => rule !== undefined);
      settings.slapRules = selectedRules;
    }
    game.updateGameSettings(settings);
    io.to(game.id).emit('gameUpdate', game.getGameState());
  }
}

function handleDisconnect(socket: Socket, io: Server) {
  console.log('User disconnected');
  const playerId = socket.id;
  lobby.removePlayer(playerId);
  io.to('lobby').emit('lobbyUpdate', lobby.getState());

  const game = gameManager.findGameByPlayerId(playerId);
  if (game) {
    game.removePlayer(playerId);
    if (game.players.length === 0) {
      lobby.games.delete(game.id);
    } else {
      io.to(game.id).emit('gameUpdate', game.getGameState());
    }
  }
}
