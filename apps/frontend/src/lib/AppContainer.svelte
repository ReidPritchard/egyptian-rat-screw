<script lang="ts">
  import { fade } from 'svelte/transition';
  import { sessionStorageStore } from '../stores/storable';
  import GameSession from './GameComponents/GameSession.svelte';
  import LobbyList from './LobbyList.svelte';
  import UiButton from './UIBlocks/UIButton.svelte';
  import UiInput from './UIBlocks/UIInput.svelte';

  const isDev = import.meta.env.DEV;

  let playerName: string = isDev ? '' : sessionStorageStore.getItem('playerName') || '';
  let tempPlayerName: string = ''; // Used when the player is prompted for a name
  let isTempNameValid = false; // Use to enable/disable the join button
  let lobbyId: string = sessionStorageStore.getItem('lobbyId') || '';
  let hasJoinedLobby = !!playerName && !!lobbyId; // TODO: Check if lobbyId is valid

  function joinLobby(
    event: CustomEvent<{ lobbyId: string; playerName: string }>
  ) {
    playerName = event.detail.playerName;
    lobbyId = event.detail.lobbyId;
    hasJoinedLobby = true;

    // sessionStorageStore.setItem('playerName', playerName);
    sessionStorageStore.setItem('lobbyId', lobbyId);
  }

  function leaveLobby() {
    playerName = '';
    lobbyId = '';
    hasJoinedLobby = false;

    sessionStorageStore.removeItem('playerName');
    sessionStorageStore.removeItem('lobbyId');
  }

  function handleSubmit(submitEvent: Event) {
    if (tempPlayerName) {
      playerName = tempPlayerName;
      // FIXME: We need to setup a way to change behavior based on the environment
      sessionStorageStore.setItem('playerName', tempPlayerName);
    }
  }
</script>

<main>
  <!-- If no username is found, prompt for a name before joining a lobby -->
  {#if !playerName}
    <div
      class="card"
      out:fade
    >
      <form on:submit|preventDefault={handleSubmit}>
        <UiInput
          label="Name"
          on:input={(e) => {
            tempPlayerName = e.detail.value;
            isTempNameValid = e.detail.isValid;
          }}
          placeholder="Enter your name"
        />
        <div class="shift-end">
          <UiButton
            variant="success"
            disabled={!tempPlayerName}
            isSubmitAction={true}
          >
            Join
          </UiButton>
        </div>
      </form>
    </div>
  {:else if !hasJoinedLobby}
    <div class="card">
      <h2>Game Lobbies:</h2>
      <LobbyList on:join={joinLobby} {playerName} />
    </div>
  {:else}
    <div class="card game-session">
      <GameSession
        gameId={lobbyId}
        {playerName}
        on:leave={leaveLobby}
      />
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

  .shift-end {
    display: flex;
    justify-content: flex-end;
  }
</style>
