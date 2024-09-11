import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { Lobby } from './Lobby';
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
const games = new Map<string, Game>();

io.on('connection', (socket: Socket) => {
    console.log('A user connected');

    socket.on('joinLobby', (playerName: string) => {
        const playerId = socket.id;
        lobby.joinGame(playerId, playerName);
        socket.join('lobby');
        io.to('lobby').emit('lobbyUpdate', lobby.getState());
    });

    socket.on('createGame', () => {
        const playerId = socket.id;
        const game = lobby.createGame(playerId);
        if (game) {
            games.set(game.id, game);
            socket.join(game.id);
            io.to(game.id).emit('gameCreated', game.getGameState());
        }
    });

    socket.on('joinGame', (gameId: string) => {
        const playerId = socket.id;
        const game = games.get(gameId);
        if (game) {
            lobby.joinGame(playerId, gameId)
            socket.join(gameId);
            io.to(gameId).emit('gameUpdate', game.getGameState());
        }
    });

    socket.on('playCard', () => {
        const playerId = socket.id;
        const game = findGameByPlayerId(playerId);
        if (game) {
            try {
                game.playCard(playerId);
                io.to(game.id).emit('gameUpdate', game.getGameState());
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
            io.to(game.id).emit('gameUpdate', game.getGameState());
            socket.emit('slapResult', isValidSlap);
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
                games.delete(game.id);
            } else {
                io.to(game.id).emit('gameUpdate', game.getGameState());
            }
        }
    });
});

function findGameByPlayerId(playerId: string): Game | undefined {
    return Array.from(games.values()).find(game => game.players.includes(playerId));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Server the frontend (at /)
app.use(express.static(path.join(__dirname, '../public')));

app.use(express.static(path.join(__dirname, '../dist')));

// Start the server
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
