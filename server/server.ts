import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Lobby, Player } from './Lobby';
import { Game } from './Game';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 3000;

const app = express();
const httpServer = createServer(app)
const io = new Server(httpServer, {
    path: '/socket.io',
    cors: {
        origin: '*',
    },
});

const lobby = new Lobby();

io.on('connection', (socket: Socket) => {
    console.log('A user connected');

    socket.on('joinLobby', (playerName: string) => {
        const playerId = socket.id;
        lobby.addPlayer(playerId, playerName);
        socket.join('lobby');
        io.to('lobby').emit('lobbyUpdate', lobby.getState());
    });

    socket.on('createGame', () => {
        const playerId = socket.id;
        const game = lobby.createGame(playerId);
        if (game) {
            socket.join(game.id);
            io.to(game.id).emit('gameCreated', game.getGameState());
            io.to('lobby').emit('lobbyUpdate', lobby.getState());
        } else {
            socket.emit('error', 'Failed to create game');
        }
    });

    socket.on('joinGame', (gameId: string) => {
        const playerId = socket.id;
        const game = lobby.joinGame(playerId, gameId);
        if (game) {
            socket.join(gameId);
            io.to(gameId).emit('gameUpdate', game.getGameState());
            io.to('lobby').emit('lobbyUpdate', lobby.getState());
        } else {
            socket.emit('error', 'Failed to join game. The game might be full or not exist.');
        }
    });

    socket.on('playCard', () => {
        const playerId = socket.id;
        const game = findGameByPlayerId(playerId);
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
    });

    socket.on('slap', () => {
        const playerId = socket.id;
        const game = findGameByPlayerId(playerId);
        if (game) {
            const isValidSlap = game.checkSlap(playerId);
            const gameState = game.getGameState();
            io.to(game.id).emit('gameUpdate', gameState);
            socket.emit('slapResult', isValidSlap);
            io.to(game.id).emit('playerAction', {
                playerId,
                actionType: isValidSlap ? 'slap' : 'invalidSlap',
                timestamp: Date.now()
            });
            if (gameState.gameOver) {
                io.to(game.id).emit('gameOver', gameState);
            }
        }
    });

    socket.on('updatePlayerName', (newName: string) => {
        const playerId = socket.id;
        const game = findGameByPlayerId(playerId);
        if (game) {
            game.updatePlayerName(playerId, newName);
            io.to(game.id).emit('gameUpdate', game.getGameState());
        } else {
            lobby.updatePlayerName(playerId, newName);
            io.to('lobby').emit('lobbyUpdate', lobby.getState());
        }
    });

    socket.on('restartGame', () => {
        const playerId = socket.id;
        const game = findGameByPlayerId(playerId);
        if (game) {
            game.restartGame();
            io.to(game.id).emit('gameUpdate', game.getGameState());
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        const playerId = socket.id;
        lobby.removePlayer(playerId);
        io.to('lobby').emit('lobbyUpdate', lobby.getState());

        const game = findGameByPlayerId(playerId);
        if (game) {
            game.removePlayer(playerId);
            if (game.players.length === 0) {
                lobby.games.delete(game.id);
            } else {
                io.to(game.id).emit('gameUpdate', game.getGameState());
            }
        }
    });
});

function findGameByPlayerId(playerId: string): Game | undefined {
    return Array.from(lobby.games.values()).find(game => game.players.some(p => p.id === playerId));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve the frontend (at /)
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.static(path.join(__dirname, '../dist')));

// Start the server
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
