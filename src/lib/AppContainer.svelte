<script lang="ts">
  // This component manages the state of the app,
  // most importantly the current view.

  // The app flow is as follows:
  // 1. User enters
  //  - Username is loaded from sessionStorage
  //  - If username is not found, user is prompted to enter one
  // 2. User can either create a new lobby or join an existing one
  //  - Ideally a list of lobbies is shown, but MVP will have user enter the lobby ID
  //  - User is then redirected to the lobby view
  // 3. User is in the lobby
  //  - User can see the lobby ID
  //  - Lobby state is managed by a separate component

  import { getContext, onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { sessionStorageStore } from '../stores/storable';

  const { createGame, doesUsernameExist, joinGame } = getContext('db-api');

  // State Variables - The main state of the app
  const username = writable<string | null>(null);
  const currentView = writable<'enter' | 'lobby' | 'promptUsername'>('enter');
  const lobbyId = writable<string | null>(null);

  // Function to load the username from sessionStorage
  function loadUsername() {
    const initialUsername = import.meta.env.DEV
      ? null
      : sessionStorageStore.getItem('username');
    if (initialUsername) {
      username.set(initialUsername);
      currentView.set('enter');
    } else {
      currentView.set('promptUsername');
    }
  }

  // Function to save the username to sessionStorage
  function saveUsername(name: string) {
    sessionStorageStore.setItem('username', name);
    username.set(name);
    currentView.set('enter');
  }

  onMount(() => {
    loadUsername();
  });

  // Page State - The state of the current page
  let inputUsername = '';
  let inputLobbyId = '';

  // Function to create a new lobby
  async function createLobby() {
    const gameId = await createGame();
    lobbyId.set(gameId);
    joinLobby();
  }

  async function joinLobby() {
    if (!lobbyId) {
      return;
    }

    await joinGame($lobbyId, $username);
    currentView.set('lobby');
  }
</script>

{#if $currentView === 'promptUsername'}
  <div>
    <h1>Enter your username</h1>
    <input
      type="text"
      bind:value={inputUsername}
      placeholder="Username"
    />
    <button on:click={() => saveUsername(inputUsername)}>Submit</button>
  </div>
{:else if $currentView === 'enter'}
  <div>
    <h2>Welcome, {$username}</h2>
    <button on:click={() => createLobby()}>Create Lobby</button>
    <input
      type="text"
      placeholder="Enter Lobby ID"
      bind:value={inputLobbyId}
    />
    <button on:click={() => joinLobby(inputLobbyId)}>Join Lobby</button>
  </div>
{:else if $currentView === 'lobby'}
  <div>
    <h1>Lobby ID: {lobbyId}</h1>
    <button on:click={() => currentView.set('enter')}>Leave Lobby</button>
  </div>
{/if}
