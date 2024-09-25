import { Server, Socket } from 'socket.io';
import { newLogger } from '../logger';
import { GameEndedPayload, GameStartedPayload, SocketEvents, VoteCount } from '../socketEvents';
import {
  Card,
  CardChallenge,
  ClientGameState,
  GameSettings,
  GameStage,
  PlayerAction,
  PlayerActionType,
  PlayerInfo,
  SlapRule,
  SlapRuleAction,
  VoteState,
} from '../types';
import { Deck } from './Deck';
import { Player } from './Player';
import { RuleEngine } from './rules/RuleEngine';
import { defaultSlapRules } from './rules/SlapRules';

const logger = newLogger('Game');

export class Game {
  public gameId: string;
  private io: Server;

  private players: Player[] = [];
  private turnIndex: number = 0;

  private centralPile: Card[] = [];
  private ruleEngine: RuleEngine;

  private stage: GameStage = GameStage.PRE_GAME;
  private winner: PlayerInfo | null = null;

  private playerActionLog: PlayerAction[] = [];

  private faceCardChallenge: CardChallenge | null = null;
  private voteState: VoteState | null = null;

  constructor(io: Server, gameId: string, rules: SlapRule[] = defaultSlapRules) {
    this.io = io;
    this.gameId = gameId;
    this.ruleEngine = new RuleEngine(this.createDefaultGameSettings(rules));

    this.stage = GameStage.PRE_GAME;
  }

  private createDefaultGameSettings(rules: SlapRule[]): GameSettings {
    return {
      minimumPlayers: 2,
      maximumPlayers: 8,
      slapRules: rules,
      faceCardChallengeCounts: { J: 1, Q: 2, K: 3, A: 4 },
      challengeCounterCards: [{ rank: '10' }],
      turnTimeout: 10000, // 10 seconds
      challengeCounterSlapTimeout: 5000, // 3 seconds
    };
  }

  public addPlayer(socket: Socket, playerInfo: PlayerInfo): boolean {
    logger.info('Adding player to game', playerInfo.name);

    if (this.stage !== GameStage.PRE_GAME) {
      logger.info('Failed to add player: Game stage is not PRE_GAME', this.stage);
      this.emitErrorToSocket(socket, 'Game has already started.');
      return false;
    }

    if (this.isGameFull()) {
      logger.info('Failed to add player: Game is full', this.players.length);
      this.emitErrorToSocket(socket, 'Game is full.');
      return false;
    }

    if (!this.isValidPlayerName(playerInfo.name)) {
      logger.info('Failed to add player: Invalid player name', playerInfo.name);
      this.emitErrorToSocket(socket, 'Invalid player name.');
      return false;
    }

    const player = new Player(socket, playerInfo.name);
    this.players.push(player);

    logger.info('Player added successfully', playerInfo.name);
    this.emitGameUpdate();

    return true;
  }

  private isGameFull(): boolean {
    return this.players.length >= this.ruleEngine.getMaximumPlayers();
  }

  private isValidPlayerName(name: string): boolean {
    return name !== '' && !this.players.some((p) => p.name === name);
  }

  public removePlayer(socket: Socket) {
    const playerIndex = this.players.findIndex((p) => p.socket.id === socket.id);
    if (playerIndex !== -1) {
      logger.info('Removing player', socket.id);
      this.players.splice(playerIndex, 1);
      logger.info('Players left', this.players.length);

      if (this.players.length > 0) {
        // If the game hasn't started or over, cancel the game
        if (this.stage !== GameStage.PLAYING && this.stage !== GameStage.GAME_OVER) {
          this.stage = GameStage.CANCELLED;
        }

        if (this.stage === GameStage.PLAYING) {
          this.checkForWinner();
        }

        this.emitGameUpdate();
      }
    }
  }

  public hasPlayer(playerId: string): boolean {
    return this.players.some((player) => player.socket.id === playerId);
  }

  public getPlayerCount(): number {
    return this.players.length;
  }

  public performPlayerAction(action: PlayerAction) {
    const player = this.players.find((p) => p.socket.id === action.playerId);
    if (player) {
      this.playerActionLog.push(action);
      switch (action.actionType) {
        case PlayerActionType.START_VOTE:
          if (action.data.voteTopic) {
            this.startVote(action.data.voteTopic);
          } else {
            this.emitErrorToSocket(player.socket, 'Vote topic not found, data payload is invalid.');
          }
          break;
        case PlayerActionType.CAST_VOTE:
          if (action.data.vote) {
            this.submitVote(action.playerId, action.data.vote);
          } else {
            this.emitErrorToSocket(player.socket, 'Vote not found, data payload is invalid.');
          }
          break;
        case PlayerActionType.SET_READY:
          if (action.data.ready) {
            this.setReady(action.playerId, action.data.ready);
          } else {
            this.emitErrorToSocket(player.socket, 'Ready not found, data payload is invalid.');
          }
          break;
        case PlayerActionType.SET_SETTINGS:
          if (action.data.settings) {
            this.setGameSettings(action.data.settings);
          } else {
            this.emitErrorToSocket(player.socket, 'Settings not found, data payload is invalid.');
          }
          break;
        default:
          logger.error('Invalid action type');
      }
    }
  }

  public getGameSettings() {
    return this.ruleEngine.getGameSettings();
  }

  public setGameSettings(settings: GameSettings) {
    // If the game is in-progress, don't allow settings to be changed
    if (this.stage === GameStage.PLAYING) {
      this.io.to(this.gameId).emit(SocketEvents.ERROR, 'Game is already in progress.');
      return;
    }

    this.ruleEngine.setGameSettings(settings);

    this.emitSettingsChanged();
  }

  private checkForStart() {
    if (this.stage === GameStage.PRE_GAME && this.players.every((p) => p.isReady())) {
      this.startGame();
    }
  }

  private startGame() {
    // reset previous state
    this.winner = null;
    this.playerActionLog = [];
    this.faceCardChallenge = null;
    this.voteState = null;

    this.stage = GameStage.PLAYING;

    const deck = Deck.createShuffledDeck();
    Deck.dealCards(deck, this.players);

    this.emitGameStarted();

    this.nextTurn();
  }

  private endGame() {
    this.stage = GameStage.PRE_GAME;
    this.emitGameUpdate();
  }

  private nextTurn() {
    if (this.players.length === 0) return;

    this.turnIndex = this.turnIndex % this.players.length;

    this.emitGameUpdate();
  }

  public handlePlayCard(socket: Socket) {
    const player = this.getPlayerBySocket(socket);
    if (player && player.socket.id === socket.id && this.players[this.turnIndex].socket.id === socket.id) {
      this.playCard(player);
    } else {
      socket.emit(SocketEvents.ERROR, 'Not your turn.');
    }
  }

  private playCard(player: Player) {
    const card = player.playCard();
    if (card) {
      this.centralPile.push(card);

      const faceCardChallengeCount = this.ruleEngine.getFaceCardChallengeCount(card);
      if (faceCardChallengeCount > 0) {
        this.handleFaceCardChallenge(player, card, faceCardChallengeCount);
      } else if (this.faceCardChallenge?.active) {
        this.handleFaceCardChallengeCounter(player, card);
      } else {
        this.advanceTurn();
      }
      this.emitGameUpdate();
    } else {
      // Player is out of cards (just skip turn)
      // don't remove player from game as they can still slap
      // back in to get cards
      this.advanceTurn();
      this.emitGameUpdate();
      this.checkForWinner();
    }
  }

  private handleFaceCardChallenge(challenger: Player, _card: Card, challengeCount: number) {
    const challenged = this.players[(this.turnIndex + 1) % this.players.length];

    this.io.to(this.gameId).emit(SocketEvents.CHALLENGE_STARTED, {
      challengerId: challenger.socket.id,
      challengedId: challenged.socket.id,
      remainingCounterChances: challengeCount,
    });

    this.faceCardChallenge = {
      active: true,
      challenger: challenger.getPlayerInfo(),
      challenged: challenged.getPlayerInfo(),
      remainingCounterChances: challengeCount,
      result: null,
    };

    this.emitGameUpdate();
    this.advanceTurn();
  }

  private handleFaceCardChallengeCounter(player: Player, card: Card) {
    if (!this.faceCardChallenge) return;

    if (this.ruleEngine.isCounterCard(card)) {
      // Counter successful, end the challenge
      this.faceCardChallenge.result = 'counter';
      this.faceCardChallenge.active = false;
      this.io.to(this.gameId).emit(SocketEvents.CHALLENGE_RESULT, {
        winnerId: player.socket.id,
        loserId: this.faceCardChallenge.challenger.id,
        message: `${player.name} has survived the card challenge!`,
      });
      this.advanceTurn();
    } else {
      this.faceCardChallenge.remainingCounterChances--;

      if (this.faceCardChallenge.remainingCounterChances === 0) {
        // Challenger wins
        const challenger = this.players.find((p) => p.name === this.faceCardChallenge?.challenger.name);
        if (challenger) {
          challenger.collectPile(this.centralPile);
          this.centralPile = [];

          this.io.to(this.gameId).emit(SocketEvents.CHALLENGE_RESULT, {
            winnerId: challenger.socket.id,
            loserId: player.socket.id,
            message: `${challenger.name} has won their challenge and has taken the pile!`,
          });
        }
        this.faceCardChallenge.result = 'challenger';
        this.faceCardChallenge.active = false;
        // The challenger (who just won) goes next
        this.turnIndex = this.players.indexOf(challenger!);
      }

      this.nextTurn();
    }

    this.emitGameUpdate();
  }

  public handleSlapAttempt(socket: Socket) {
    const player = this.getPlayerBySocket(socket);
    if (player) {
      const validRules = this.ruleEngine.getValidSlapRules(this.centralPile, player);
      if (validRules.length > 0) {
        logger.info(
          'Valid rules:',
          validRules.map((r) => r.name),
        );
        // Reward for correct slap based on the rule's action
        const firstRule = validRules[0];
        let target = [this.players.find((p) => p.name === firstRule.targetPlayerName)];
        logger.info('Target:', target);
        logger.info('Action:', firstRule.action);
        switch (firstRule.action) {
          case SlapRuleAction.TAKE_PILE:
            player.collectPile(this.centralPile);
            this.centralPile = [];
            // Since the pile is cleared, any challenges are cancelled
            this.faceCardChallenge = null;
            break;
          case SlapRuleAction.DRINK_ALL:
            target = this.players.filter((p) => p.name !== player.name);
          case SlapRuleAction.SKIP:
          case SlapRuleAction.DRINK:
            break;
        }

        this.io.to(this.gameId).emit(SocketEvents.SLAP_RESULT, {
          playerId: player.socket.id,
          result: 'valid',
          message: `Slap successful: ${target.map((p) => p?.name).join(', ')} ${firstRule.action}`,
        });

        this.io.to(this.gameId).emit(SocketEvents.GAME_PILE_UPDATED, this.centralPile);

        // Set the turn to the player who made the valid slap
        // -1 because the turn will be incremented inside advanceTurn()
        this.turnIndex = this.players.indexOf(player) - 1;

        this.advanceTurn();

        // For now emit a game update to ensure everything is in sync,
        // we likely just want to conditionally emit a pile change event
        // if someone has taken it
        // this.emitGameUpdate();
      } else {
        // Penalty for incorrect slap
        const penaltyCard = player.givePenaltyCard();
        if (penaltyCard) {
          this.centralPile.unshift(penaltyCard);
        }
        this.io.to(this.gameId).emit(SocketEvents.SLAP_RESULT, {
          playerId: player.socket.id,
          result: 'invalid',
          message: 'Slap unsuccessful',
        });
        this.io.to(this.gameId).emit(SocketEvents.GAME_PILE_UPDATED, this.centralPile);
      }
    }
  }

  private advanceTurn() {
    const previousPlayerId = this.getCurrentPlayerId();
    this.turnIndex = (this.turnIndex + 1) % this.players.length;
    this.io.to(this.gameId).emit(SocketEvents.TURN_CHANGED, {
      previousPlayerId,
      currentPlayerId: this.getCurrentPlayerId(),
    });
    this.nextTurn();
  }

  private getPlayerBySocket(socket: Socket): Player | undefined {
    return this.players.find((player) => player.socket.id === socket.id);
  }

  private checkForWinner() {
    if (this.stage !== GameStage.PLAYING) return;

    // The win condition is when a single player has all the cards
    const totalCards = this.players.reduce((acc, player) => acc + player.getDeckSize(), 0) + this.centralPile.length;
    // ^ should always be 52, but this allows for multiple decks
    if (totalCards === 0) {
      // This happens when a game is initialized but has never started
      return;
    }

    // TODO: Technically the last player should "play out" the hand, playing cards into the pile
    // for the last player not yet eliminated. Meaning the game is only over when the pile is empty
    // Currently we don't support this as it's pretty confusing to implement.

    for (const player of this.players) {
      if (player.getDeckSize() === totalCards) {
        this.stage = GameStage.GAME_OVER;
        this.winner = player.getPlayerInfo();

        this.emitGameEnded();
        return;
      }
    }
  }

  public getGameState(): ClientGameState {
    const playerData = this.getPlayerData();
    return {
      name: this.gameId,
      stage: this.stage,
      pileCards: this.centralPile,

      playerIds: this.players.map((p) => p.socket.id),
      playerHandSizes: playerData.handSizes,
      playerNames: playerData.playerNames,
      playerReadyStatus: playerData.playerReadyStatus,

      currentPlayerId: this.getCurrentPlayerId(),

      winner: this.winner,
      gameSettings: this.ruleEngine.getGameSettings(),

      voteState: this.voteState,
      cardChallenge: this.getActiveCardChallenge(),
    };
  }

  private getPlayerData() {
    return this.players.reduce(
      (acc, player) => {
        acc.handSizes[player.socket.id] = player.getDeckSize();
        acc.playerNames[player.socket.id] = player.name;
        acc.playerReadyStatus[player.socket.id] = player.isReady();
        return acc;
      },
      {
        handSizes: {},
        playerNames: {},
        playerReadyStatus: {},
      } as {
        handSizes: Record<string, number>;
        playerNames: Record<string, string>;
        playerReadyStatus: Record<string, boolean>;
      },
    );
  }

  private getCurrentPlayerId(): string {
    return this.players[this.turnIndex]?.socket.id ?? '';
  }

  private getActiveCardChallenge(): CardChallenge | null {
    return this.faceCardChallenge?.active ? this.faceCardChallenge : null;
  }

  private emitSettingsChanged() {
    this.io.to(this.gameId).emit(SocketEvents.GAME_SETTINGS_CHANGED, this.ruleEngine.getGameSettings());
  }

  private emitGameStarted() {
    const payload: GameStartedPayload = {
      startTime: Date.now(),
    };
    this.io.to(this.gameId).emit(SocketEvents.GAME_STARTED, payload);
  }

  private emitGameEnded() {
    const payload: GameEndedPayload = {
      winner: this.winner,
    };
    this.io.to(this.gameId).emit(SocketEvents.GAME_ENDED, payload);
  }

  private emitGameUpdate() {
    logger.info(
      'Players',
      this.players.map((p) => p.name),
      this.io.sockets.adapter.rooms,
    );
    logger.info('Emitting game update', this.gameId);
    this.io.to(this.gameId).emit(SocketEvents.GAME_STATE_UPDATED, this.getGameState());
  }

  private emitErrorToSocket(socket: Socket, message: string) {
    socket.emit(SocketEvents.ERROR, message);
  }

  private setReady(playerId: string, ready: boolean) {
    const player = this.players.find((p) => p.socket.id === playerId);
    if (player) {
      player.setReady(ready);
      if (ready) {
        this.io.to(this.gameId).emit(SocketEvents.PLAYER_READY, player.getPlayerInfo());
      } else {
        this.io.to(this.gameId).emit(SocketEvents.PLAYER_NOT_READY, player.getPlayerInfo());
      }

      this.checkForStart();
    }
  }

  public startVote(topic: string) {
    logger.info('Starting vote', topic);
    if (this.stage === GameStage.VOTING) {
      logger.info('Vote already in progress');
      return;
    }

    this.voteState = {
      topic,
      votes: [],
      totalPlayers: this.players.length,
    };
    this.io.to(this.gameId).emit(SocketEvents.VOTE_STARTED, this.voteState);
  }

  public submitVote(playerId: string, vote: boolean) {
    if (this.stage !== GameStage.VOTING || !this.voteState) return;

    const existingVoteIndex = this.voteState.votes.findIndex((v) => v.playerId === playerId);
    if (existingVoteIndex !== -1) {
      this.voteState.votes[existingVoteIndex].vote = vote;
    } else {
      this.voteState.votes.push({ playerId, vote });
    }

    this.io.to(this.gameId).emit(SocketEvents.VOTE_UPDATED, this.voteState);

    if (this.voteState.votes.length === this.voteState.totalPlayers) {
      this.resolveVote();
    }
  }

  private resolveVote() {
    if (this.stage !== GameStage.VOTING || !this.voteState) return;

    const yesVotes = this.voteState.votes.filter((v) => v.vote).length;
    const result = yesVotes > this.voteState.totalPlayers / 2;

    // Handle the result (e.g., start the game if voting to start)
    if (this.voteState.topic === 'startGame' && result) {
      this.startGame();
    } else if (this.voteState.topic === 'endGame' && result) {
      this.endGame();
    }

    const voteCount: VoteCount = {
      yes: yesVotes,
      no: this.voteState.totalPlayers - yesVotes,
    };

    this.io.to(this.gameId).emit(SocketEvents.VOTE_ENDED, {
      voteResult: result,
      voteCount,
    });

    // Reset vote state
    this.voteState = null;
  }

  // Add this new public method
  public getStage(): GameStage {
    return this.stage;
  }
}
