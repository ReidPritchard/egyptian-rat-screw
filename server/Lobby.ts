import { Game } from './Game';
import { v4 as uuidv4 } from 'uuid';

export interface Player {
  id: string;
  name: string;
}

export class Lobby {
  players: Player[] = [];
  games: Map<string, Game> = new Map();

  addPlayer(playerId: string, playerName: string): Player {
    const player = { id: playerId, name: playerName };
    const existingPlayerIndex = this.players.findIndex(p => p.id === playerId);
    if (existingPlayerIndex !== -1) {
      this.players[existingPlayerIndex] = player;
    } else {
      this.players.push(player);
    }
    return player;
  }

  createGame(hostId: string): Game | null {
    const host = this.getPlayer(hostId);
    if (!host) return null;

    const game = new Game([host]);
    this.games.set(game.id, game);
    this.removePlayer(hostId);
    return game;
  }

  joinGame(playerId: string, gameId: string): Game | null {
    const game = this.games.get(gameId);
    if (!game) return null;

    const player = this.getPlayer(playerId);
    if (!player) return null;

    if (game.players.length < game.maxPlayers) {
      game.addPlayer(player);
      this.removePlayer(playerId);
      return game;
    } else {
      return null; // Game is full
    }
  }

  removePlayer(playerId: string): void {
    this.players = this.players.filter(p => p.id !== playerId);
  }

  getState() {
    return {
      players: this.players,
      games: Array.from(this.games.values()).map(game => ({
        id: game.id,
        name: game.name,
        playerCount: game.players.length,
        maxPlayers: game.maxPlayers
      }))
    };
  }

  updatePlayerName(playerId: string, newName: string): void {
    const player = this.getPlayer(playerId);
    if (player) {
      player.name = newName;
      console.log(`Player ${playerId} updated name to ${newName} in lobby`);
    }
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.find(p => p.id === playerId);
  }
}