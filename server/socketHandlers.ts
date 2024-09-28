import { Server, Socket } from 'socket.io';
import { GameManager } from './GameManager';
import { newLogger } from './logger';
import { MessagePayload, SocketEvents, SocketPayloads } from './socketEvents';
import { GameSettings, PlayerAction } from './types';

const logger = newLogger('socketHandlers');

let io: Server;
let gameManager: GameManager;

export function setupSocketHandlers(ioServer: Server) {
  io = ioServer;
  gameManager = GameManager.getInstance(io);

  io.on(SocketEvents.CONNECT, (socket: Socket) => {
    logger.info('A user connected', socket.id);

    // Add the player to the lobby via GameManager
    gameManager.initPlayerInLobby(
      {
        id: socket.id,
        name: '',
      },
      socket,
    );

    socket.on(SocketEvents.CHANGE_NAME, ({ name }: SocketPayloads[SocketEvents.CHANGE_NAME]) => {
      logger.info('Setting player name', name);
      gameManager.setPlayerName(socket.id, name);
    });

    socket.on(SocketEvents.JOIN_GAME, ({ gameId }: SocketPayloads[SocketEvents.JOIN_GAME]) => {
      const player = gameManager.getLobbyPlayer(socket.id);
      if (player) {
        logger.info('Joining game', player.name, 'in game', gameId);
        gameManager.joinGame(gameId, player, socket);
      }
    });

    socket.on(SocketEvents.CREATE_GAME, () => {
      logger.info('Creating game', socket.id);
      const player = gameManager.getLobbyPlayer(socket.id);
      if (player) {
        gameManager.joinGame('', player, socket);
      }
    });

    socket.on(SocketEvents.LEAVE_GAME, () => {
      logger.info('Leaving game', socket.id);
      gameManager.leaveGame(socket);
    });

    socket.on(SocketEvents.PLAY_CARD, (_props: SocketPayloads[SocketEvents.PLAY_CARD]) => {
      logger.info('Playing card', socket.id);
      gameManager.handlePlayCard(socket);
    });

    socket.on(SocketEvents.SLAP_PILE, (_props: SocketPayloads[SocketEvents.SLAP_PILE]) => {
      logger.info('Slapping pile', socket.id);
      gameManager.handleSlapPile(socket);
    });

    socket.on(SocketEvents.PLAYER_READY, () => {
      logger.info('Player ready', socket.id);
      gameManager.handlePlayerReady(socket);
    });

    socket.on(SocketEvents.PLAYER_ACTION, (action: PlayerAction) => {
      logger.info('Performing player action', action);
      gameManager.performPlayerAction(socket, action);
    });

    socket.on(SocketEvents.SET_GAME_SETTINGS, (settings: GameSettings) => {
      logger.info('Setting game settings', settings);
      gameManager.setGameSettings(socket, undefined, settings);
    });

    socket.on(SocketEvents.MESSAGE, (message: MessagePayload) => {
      const { message: messageText, timestamp } = message;
      logger.info('Received message', socket.id, messageText, timestamp);
      // gameManager.handleMessage(socket, message);
    });

    socket.on(SocketEvents.ERROR, (error: Error) => {
      logger.error(error);
      socket.emit(SocketEvents.ERROR, error.message);
    });

    socket.on(SocketEvents.DISCONNECTING, () => {
      logger.info('Disconnecting player', socket.id);
      gameManager.handleDisconnect(socket);
    });

    socket.on(SocketEvents.DISCONNECT, () => {
      logger.info('A user disconnected');
    });
  });
}
