<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import type { ERSGameSession } from '@oers/game-core';
  import UiButton from './UIBlocks/UIButton.svelte';

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

<UiButton
  on:click={createLobby}
  variant="primary"
>
  Create new lobby
</UiButton>

{#if isLoading}
  <p>Loading...</p>
{:else if error}
  <p>Error: {error}</p>
{:else if lobbies.length === 0}
  <p>No lobbies available.</p>
{:else}
  <!-- TODO: Add search functionality -->
  <ul>
    {#each lobbies as lobby}
      <li>
        <UiButton
          on:click={() => joinLobby(lobby.id)}
          variant="secondary"
        >
          <h2>{lobby.id.toUpperCase()}</h2>
          <div class="details">
            <p>Players: {lobby.players.length}/{lobby.maxPlayers}</p>
            <p>Status: {lobby.state}</p>
          </div>
        </UiButton>
      </li>
    {/each}
  </ul>
{/if}

<style>
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  li {
    margin: 1em 0;
    padding: 1em;
    border: 1px solid var(--accent-color);
    border-radius: 8px;
    transition: background-color 0.25s ease;
  }
  li:hover {
    background-color: var(--accent-color-light);
  }
  h2 {
    margin: 0;
    font-size: 1.2em;
    color: var(--text-color-dark);
    padding: 0 0.5em;
    text-align: start;
  }
  .details {
    font-size: 0.8em;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    color: var(--text-color-light);
  }

  .details p {
    /* Improve spacing between details */
    margin: 0.5em 0;
    padding: 0 0.5em;
  }
</style>
