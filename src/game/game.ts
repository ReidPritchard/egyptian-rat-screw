import { onValue, type DatabaseReference } from 'firebase/database';
import type { PenaltyRule, Player, SlapRule } from '../resources/db-interfaces';
import { getGameReference } from '../utils/db-api';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

class Game {
  private state: GameState;

  private gameReference: DatabaseReference;

  constructor(
    gameId: string,
    players: Player[],
    slapRules: SlapRule[],
    penaltyRules: PenaltyRule[]
  ) {
    this.state = {
      players,
      centralPile: [],
      currentPlayerIndex: 0,
      currentChances: 0,
      slapRules,
      penaltyRules,
      isGameActive: true,
    };
    this.syncWithFirebase(gameId);
  }

  private syncWithFirebase(gameId: string) {
    getGameReference(gameId).then((gameRef) => {
      onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          this.state = data;
        }
      });
    });
  }

  playCard(player: Player, gameId: string) {
    if (!this.state.isGameActive) return;

    const card = player.hand.pop();
    if (!card) return;

    this.state.centralPile.push(card);
    this.updateChances(card);

    if (this.state.currentChances === 0) {
      this.claimPile(this.state.players[this.state.currentPlayerIndex], gameId);
    } else {
      this.advanceTurn();
    }

    this.checkSlapRules();
    this.updateFirebaseState(gameId);
  }

  async slapPile(player: Player, gameId: string) {
    if (!this.state.isGameActive) return;

    const slapPile = httpsCallable(functions, 'slapPile');
    try {
      const result = await slapPile({ gameId, playerId: player.id });
      if (result.data.pileClaimed) {
        console.log('Pile claimed successfully.');
      } else {
        console.log('Penalty applied.');
      }
    } catch (error) {
      console.error('Error slapping pile:', error);
    }
  }

  private updateChances(card: Card) {
    switch (card.rank) {
      case Rank.Ace:
        this.state.currentChances = 4;
        break;
      case Rank.King:
        this.state.currentChances = 3;
        break;
      case Rank.Queen:
        this.state.currentChances = 2;
        break;
      case Rank.Jack:
        this.state.currentChances = 1;
        break;
      default:
        if (this.state.currentChances > 0) {
          this.state.currentChances--;
        }
        break;
    }
  }

  private checkSlapRules() {
    // Logic to check if the current central pile meets any slap rules
  }

  private claimPile(player: Player, gameId: string) {
    gameRef.transaction((gameData) => {
      if (!gameData) return;

      player.hand = player.hand.concat(gameData.centralPile);
      gameData.centralPile = [];
      gameData.currentChances = 0;
      return gameData;
    });
  }

  private updateFirebaseState(gameId: string) {
    const gameRef = database.ref(`games/${gameId}`);
    gameRef.set(this.state);
  }

  private advanceTurn() {
    this.state.currentPlayerIndex =
      (this.state.currentPlayerIndex + 1) % this.state.players.length;
  }
}
