import { type Messenger, MessengerEvents } from "@oer/message";
import {
  type ISocketPayloads,
  type MessagePayload,
  SocketEvents,
} from "@oer/shared/socketEvents";
import type { PlayerAction } from "@oer/shared/types";
import { newLogger } from "../logger.js";
import { GameManager } from "../manager/GameManager.js";

const logger = newLogger("MessageHandlers");

export const setupMessageHandlers = (messenger: Messenger) => {
  const gameManager = GameManager.getInstance();

  messenger.on(
    SocketEvents.CHANGE_NAME,
    (data: ISocketPayloads[SocketEvents.CHANGE_NAME]) => {
      gameManager.setPlayerName(messenger, data.name);
    }
  );

  messenger.on(
    SocketEvents.JOIN_GAME,
    (data: ISocketPayloads[SocketEvents.JOIN_GAME]) => {
      gameManager.joinGame(data.roomId, messenger);
    }
  );

  messenger.on(SocketEvents.CREATE_GAME, (data: { playerName?: string }) => {
    const createPlayer = gameManager.getPlayerInfo(messenger);
    if (createPlayer) {
      if (data?.playerName) {
        createPlayer.name = data.playerName;
      }
      gameManager.joinGame("", messenger);
    }
  });

  messenger.on(SocketEvents.LEAVE_GAME, () => {
    gameManager.leaveGame(messenger);
  });

  messenger.on(SocketEvents.PLAY_CARD, () => {
    gameManager.handlePlayCard(messenger);
  });

  messenger.on(SocketEvents.SLAP_PILE, () => {
    gameManager.handleSlapPile(messenger);
  });

  messenger.on(SocketEvents.PLAYER_READY, () => {
    gameManager.handlePlayerReady(messenger);
  });

  messenger.on(SocketEvents.PLAYER_ACTION, (data: PlayerAction) => {
    gameManager.performPlayerAction(messenger, data);
  });

  messenger.on(
    SocketEvents.SET_GAME_SETTINGS,
    (data: ISocketPayloads[SocketEvents.SET_GAME_SETTINGS]) => {
      const { settings } = data;
      gameManager.setGameSettings(messenger, settings);
    }
  );

  messenger.on(SocketEvents.MESSAGE, (data: MessagePayload) => {
    const { message: messageText, timestamp } = data;
    logger.warn(
      `Received message: ${messenger.id} ${messageText} ${timestamp}`
    );
  });

  messenger.on(SocketEvents.JOIN_LOBBY, () => {
    gameManager.addPlayerToLobby(messenger);
  });

  messenger.on(MessengerEvents.CONNECTION_INIT, () => {
    messenger.emit(MessengerEvents.CONNECTION_ACK, { id: messenger.id });
    // Move the messenger to the global room on initial connection
    GameManager.messageServer.moveMessengerToGlobalRoom(messenger);
  });
};
