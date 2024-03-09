<script lang="ts">
  import logo from './assets/logo-v01.webp';
  import AppContainer from './lib/AppContainer.svelte';
  import ThemeToggle from './lib/UIBlocks/ThemeToggle.svelte';
  import { sessionStorageStore } from './stores/storable';

  let hasJoinedLobby =
    !!sessionStorageStore.getItem('playerName') &&
    !!sessionStorageStore.getItem('lobbyId');

  // Subscribe to changes in session storage
  sessionStorageStore.subscribe((value) => {
    console.log('sessionStorageStore changed:', value);
    hasJoinedLobby =
      !!sessionStorageStore.getItem('playerName') &&
      !!sessionStorageStore.getItem('lobbyId');
  });

  // If user prefers dark mode, set the theme to dark
  let theme = 'light';
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    theme = 'dark';
  }
</script>

<main
  class="container"
  data-theme={theme}
>
  <header>
    {#if !hasJoinedLobby}
      <div>
        <img
          src={logo}
          class="logo"
          alt="Egyptian Rat Screw logo"
        />
      </div>
      <h1>Egyptian Rat Screw</h1>
    {:else}
      <h1>Egyptian Rat Screw</h1>
    {/if}
    <ThemeToggle />
  </header>

  <AppContainer />
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

  header {
    position: absolute;
    top: 0;
    left: 0;
    width: 80%;

    display: flex;
    justify-content: space-between;
    align-items: center;

    padding: 1rem 5rem;
  }
</style>
