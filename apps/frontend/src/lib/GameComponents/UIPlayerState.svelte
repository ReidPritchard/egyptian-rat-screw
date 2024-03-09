<script lang="ts">
  import type { PlayerStatus } from '@oers/game-core';
  import { draw, fade } from 'svelte/transition';

  export let state: PlayerStatus = 'unknown';
  export let isCurrentPlayer = true;

  const pathTransition = { duration: 700 };
</script>

<div
  transition:fade={{ duration: 300 }}
  class="main"
  class:current-player={isCurrentPlayer}
>
  <svg
    class="state"
    class:svg-ready={state === 'ready'}
    class:svg-waiting={state === 'waiting'}
    class:svg-unknown={state === 'unknown'}
    viewBox="0 0 24 24"
  >
    {#if state === 'ready'}
      <path
        in:draw={pathTransition}
        out:fade={pathTransition}
        style="stroke: green; stroke-width: 2;"
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
      />
    {:else if state === 'waiting'}
      <path
        in:draw={pathTransition}
        out:fade={pathTransition}
        style="stroke: red; stroke-width: 2;"
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      />
    {:else}
      <path
        out:fade={pathTransition}
        style="stroke: black;"
        d="M12 4C9.243 4 7 6.243 7 9h2c0-1.654 1.346-3 3-3s3 1.346 3 3c0 1.069-.454 1.465-1.481 2.255-.382.294-.813.626-1.226 1.038C10.981 13.604 10.995 14.897 11 15v2h2v-2.009c0-.024.023-.601.707-1.284.32-.32.682-.598 1.031-.867C15.798 12.024 17 11.1 17 9c0-2.757-2.243-5-5-5zm-1 14h2v2h-2z"
      />
    {/if}
  </svg>
</div>

{#if isCurrentPlayer}
  <div>
    <button on:click={() => (state = 'ready')}>Ready</button>
    <button on:click={() => (state = 'waiting')}>Not Ready</button>
  </div>
{/if}

<style>
  .state {
    width: 50px;
    height: 50px;
    fill: none;
    transition:
      transform 0.3s ease-in-out,
      opacity 0.3s ease;
  }
  .main {
    /* Adjust scale for current player for better visibility */
    transform: scale(var(--player-scale));
    transition: transform 0.3s ease;
  }
  :global(:root) {
    --player-scale: 1; /* Default scale */
  }
  .main.current-player {
    --player-scale: 1.5; /* Increased scale for current player */
  }
</style>
