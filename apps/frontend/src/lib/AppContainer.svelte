<script lang="ts">
  import { sessionStorageStore } from "../stores/storable";
  import GameSession from "./GameSession.svelte";
  import LobbyList from "./LobbyList.svelte";

  let playerName: string = sessionStorageStore.getItem("playerName") || "";
  let lobbyId: string = sessionStorageStore.getItem("lobbyId") || "";
  let hasJoinedLobby = !!playerName && !!lobbyId; // TODO: Check if lobbyId is valid

  function joinLobby(
    event: CustomEvent<{ lobbyId: string; playerName: string }>
  ) {
    playerName = event.detail.playerName;
    lobbyId = event.detail.lobbyId;
    hasJoinedLobby = true;

    sessionStorageStore.setItem("playerName", playerName);
    sessionStorageStore.setItem("lobbyId", lobbyId);
  }

  function leaveLobby() {
    playerName = "";
    lobbyId = "";
    hasJoinedLobby = false;

    sessionStorageStore.removeItem("playerName");
    sessionStorageStore.removeItem("lobbyId");
  }
</script>

<main>
  {#if !hasJoinedLobby}
    <div class="card">
      <h2>Game Lobbies:</h2>
      <LobbyList on:join={joinLobby} />
    </div>
  {:else}
    <div class="card game-session">
      <GameSession gameId={lobbyId} {playerName} on:leave={leaveLobby} />
    </div>
  {/if}
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }

  .card.game-session {
    /* Make this a lot bigger to accomidate all the game related UI */
    width: 80%;
    height: 80%;
  }

  .card {
    padding: 1rem;
    border-radius: 0.5rem;
  }
</style>
