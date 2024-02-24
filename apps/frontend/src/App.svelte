<script lang="ts">
  import logo from "./assets/logo.png";
  import GameSession from "./lib/GameSession.svelte";
  import LobbyList from "./lib/LobbyList.svelte";

  let hasJoinedLobby = false;
  let playerName: string;
  let lobbyId: string;

  function joinLobby(
    event: CustomEvent<{ lobbyId: string; playerName: string }>
  ) {
    playerName = event.detail.playerName;
    lobbyId = event.detail.lobbyId;
    hasJoinedLobby = true;
  }
</script>

<main>
  <div>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={logo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <h1>Egyptian Rat Screw</h1>

  {#if !hasJoinedLobby}
    <div class="card">
      <h2>Game Lobbies:</h2>
      <LobbyList on:join={joinLobby} />
    </div>
  {:else}
    <div class="card">
      <h2>Game Lobby:</h2>
      <p>Player Name: {playerName}</p>
      <p>Lobby ID: {lobbyId}</p>
      <GameSession gameId={lobbyId} {playerName} />
    </div>
  {/if}
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
</style>
