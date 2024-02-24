<script lang="ts">
  import { onMount } from "svelte";
  import type { ERSGameSession } from "@oers/game-core";

  let lobbies: ERSGameSession[] = [];
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      const response = await fetch("/api/games");
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
  });
</script>

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
        <p>{JSON.stringify(lobby)}</p>
        <h2>ID: {lobby.id}</h2>
        <p>Players: {lobby.players}</p>
        <p>Status: {lobby.state}</p>
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
  }
</style>
