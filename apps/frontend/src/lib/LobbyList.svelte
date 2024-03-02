<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type { ERSGameSession } from '@oers/game-core';

  const dispatch = createEventDispatcher();

  let lobbies: ERSGameSession[] = [];
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    await loadLobbies();
  });

  async function loadLobbies() {
    try {
      const response = await fetch('/api/games');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      lobbies = await response.json();
    } catch (e) {
      // @ts-ignore
      error = e.message;
    } finally {
      isLoading = false;
    }
  }

  async function createLobby() {
    try {
      const response = await fetch('/api/games', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      await loadLobbies();
    } catch (e) {
      // @ts-ignore
      error = e.message;
    }
  }

  async function joinLobby(lobbyId: string) {
    // Get the player's name
    const playerName = prompt('Enter your name');
    try {
      const response = await fetch(`/api/games/${lobbyId}/join`, {
        method: 'POST',
        body: JSON.stringify({ playerName }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      dispatch('join', { lobbyId, playerName });
    } catch (e) {
      // @ts-ignore
      error = e.message;
    }
  }
</script>

<button on:click={createLobby}>Create new lobby</button>

{#if isLoading}
  <p>Loading...</p>
{:else if error}
  <p>Error: {error}</p>
{:else if lobbies.length === 0}
  <p>No lobbies available.</p>
{:else}
  <ul>
    {#each lobbies as lobby}
      <li>
        <button on:click={() => joinLobby(lobby.id)}>
          <h2>{lobby.id.toUpperCase()}</h2>
          <div class="details">
            <p>Players: {lobby.players.length}/{lobby.maxPlayers}</p>
            <p>Status: {lobby.state}</p>
          </div>
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  ul {
    list-style: none;
    padding: 0;
  }
  li {
    margin: 0.5em 0;
    padding: 1em;
    border: 1px solid var(--dark-color);

    border-radius: 8px;
  }
  h2 {
    margin: 0;
  }
  .details {
    font-size: 0.8em;
    display: flex;
    justify-content: space-between;
  }
</style>
