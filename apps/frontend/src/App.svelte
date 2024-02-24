<script lang="ts">
  import logo from "./assets/logo.png";
  import LobbyList from "./lib/LobbyList.svelte";
</script>

<main>
  <div>
    <a href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={logo} class="logo svelte" alt="Svelte Logo" />
    </a>
  </div>
  <h1>Egyptian Rat Screw</h1>

  <div class="card">
    <h2>Game Lobbies:</h2>
    <LobbyList />
  </div>
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
