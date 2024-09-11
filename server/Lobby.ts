import { Game } from './Game';
import { v4 as uuidv4 } from 'uuid';

interface Player {
  id: string;
  name: string;
}

export class Lobby {
  players: Player[] = [];
  games: Map<string, Game> = new Map();

  joinGame(playerId: string, playerName: string): void {
    const existingPlayer = this.players.find(p => p.id === playerId);
    if (existingPlayer) {
      existingPlayer.name = playerName;
    } else {
      this.players.push({ id: playerId, name: playerName });
    }
  }

  createGame(hostId: string): Game | null {
    const host = this.players.find(p => p.id === hostId);
    if (!host) return null;

    const game = new Game([host.id]);
    this.games.set(game.id, game);
    this.removePlayer(hostId);
    return game;
  }

  joinExistingGame(playerId: string, gameId: string): boolean {
    const game = this.games.get(gameId);
    if (!game) return false;

    const player = this.players.find(p => p.id === playerId);
    if (!player) return false;

    game.addPlayer(player.id);
    this.removePlayer(playerId);
    return true;
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter(p => p.id !== playerId);
  }

  getState() {
    return {
      players: this.players,
      games: Array.from(this.games.values()).map(game => ({
        id: game.id,
        playerCount: game.players.length
      }))
    };
  }
}