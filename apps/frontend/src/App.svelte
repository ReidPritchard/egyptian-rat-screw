<script lang="ts">
  import logo from './assets/logo-v01.webp';
  import AppContainer from './lib/AppContainer.svelte';
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
</script>

<main>
  {#if !hasJoinedLobby}
    <div class="fadeIn">
      <a
        href="https://svelte.dev"
        target="_blank"
        rel="noreferrer"
      >
        <img
          src={logo}
          class="logo svelte"
          alt="Svelte Logo"
        />
      </a>
    </div>
    <h1>Egyptian Rat Screw</h1>
  {:else}
    <header class="fadeIn">
      <h1>Egyptian Rat Screw</h1>
    </header>
  {/if}

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
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }

  header {
    position: absolute;
    top: 0;
    left: 0;
    width: 50%;

    display: flex;
    justify-content: start;
    align-items: center;
    gap: 1rem;

    padding: 1rem 5rem;
  }
</style>
