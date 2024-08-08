<script lang="ts">
  import logo from './assets/logo-v01.webp';
  import rat from './assets/rat.png';
  import ratSlap from './assets/rat-slap.png';
  import AppContainer from './lib/AppContainer.svelte';
  // import ThemeToggle from './lib/UIBlocks/ThemeToggle.svelte';
  import { doesUsernameExist, createGame, joinGame } from './utils/db-api';
  import { sessionStorageStore } from './stores/storable';
  import { onDestroy, setContext } from 'svelte';

  $: hasJoinedLobby =
    !!$sessionStorageStore.playerName && !!$sessionStorageStore.lobbyId;

  // Setup context for db
  setContext('db-api', {
    doesUsernameExist,
    createGame,
    joinGame,
  });

  let headerOffset = 0;

  // on disconnect, remove player from lobby
  onDestroy(() => {
    if (hasJoinedLobby) {
      sessionStorageStore.lobbyId = '';
    }
  });
</script>

<header bind:offsetHeight={headerOffset}>
  {#if !hasJoinedLobby}
    <div>
      <img
        src={rat}
        class="logo"
        alt="Egyptian Rat Screw logo"
      />
    </div>
    <h1>Egyptian Rat Screw</h1>
  {:else}
    <h1>Egyptian Rat Screw</h1>
  {/if}
  <!-- <ThemeToggle /> -->
</header>

<main class="container">
  <AppContainer />
</main>

<style>
  .logo {
    height: 10em;
    padding: 1.5em;
    border-radius: 50%;

    will-change: filter;
    transition: filter 300ms;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em var(--accent-color));
  }

  header {
    position: absolute;
    top: 0;
    left: 0;
    width: 80%;
    z-index: 1;

    display: flex;
    justify-content: space-between;
    align-items: center;

    transition: all 0.3s ease;
  }

  main {
    position: relative;
    z-index: 0;
    transition: padding-top 0.3s ease;
  }
</style>
