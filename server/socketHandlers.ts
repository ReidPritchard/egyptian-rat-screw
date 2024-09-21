import { Server, Socket } from 'socket.io';
import { GameManager } from './GameManager';
import { SocketEvents, SocketPayloads } from './socketEvents';
import { GameSettings, PlayerActionType, PlayerInfo } from './types';

let io: Server;
let gameManager: GameManager;

export function setupSocketHandlers(ioServer: Server) {
  io = ioServer;
  gameManager = GameManager.getInstance(io);

  io.on('connection', (socket: Socket) => {
    console.log('A user connected');

    // Add the player to the lobby via GameManager
    gameManager.initPlayerInLobby(
      {
        id: socket.id,
        name: '',
      },
      socket,
    );
    io.emit(SocketEvents.LOBBY_UPDATE, gameManager.getLobbyState());

    socket.on(SocketEvents.SET_PLAYER_NAME, (playerName: string) => {
      console.log('Setting player name', playerName);
      // Use GameManager to set player name
      gameManager.setPlayerName(socket.id, playerName);
    });

    socket.on(SocketEvents.JOIN_GAME, (gameId: string) => {
      const player = gameManager.getLobbyPlayer(socket.id);
      if (player) {
        gameManager.joinGame(gameId, player, socket);
      }
    });

    socket.on(SocketEvents.LEAVE_GAME, () => {
      gameManager.leaveGame(socket);
    });

    socket.on(SocketEvents.PLAYER_ACTION, (actionType: PlayerActionType) => {
      gameManager.performPlayerAction(socket, actionType);
    });

    socket.on(SocketEvents.GET_GAME_SETTINGS, (gameId: string) => {
      gameManager.getGameSettings(socket, gameId);
    });

    socket.on(SocketEvents.SET_GAME_SETTINGS, (settings: GameSettings) => {
      gameManager.setGameSettings(socket, undefined, settings);
    });

    socket.on(SocketEvents.ERROR, (error: Error) => {
      console.error(error);
      socket.emit(SocketEvents.ERROR, error.message);
    });

    socket.on(SocketEvents.START_VOTE, ({ topic }: SocketPayloads[SocketEvents.START_VOTE]) => {
      console.log('Starting vote', topic);
      gameManager.startVote(socket, topic);
    });

    socket.on(SocketEvents.SUBMIT_VOTE, ({ vote }: SocketPayloads[SocketEvents.SUBMIT_VOTE]) => {
      gameManager.submitVote(socket, vote);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected');
      gameManager.handleDisconnect(socket);
    });
  });
}
