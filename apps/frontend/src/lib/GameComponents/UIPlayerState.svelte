<script lang="ts">
  import type { PlayerStatus } from '@oers/game-core';
  import { fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { expand } from '../../utils/transitions';

  export let state: PlayerStatus = 'unknown';

  /**
   * A prop to determine if the state is for the current player
   * or if it's for a different player in the game.
   */
  export let isCurrentPlayer = false;
</script>

<div
  transition:fade={{ duration: 300 }}
  class:main={isCurrentPlayer}
>
  {#if state === 'ready'}
    <svg
      class="state svg-ready"
      viewBox="0 0 24 24"
    >
      <!-- Check mark SVG -->
      <path
        in:expand={{ duration: 400, delay: 1000, easing: quintOut }}
        d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
      />
    </svg>
  {:else if state === 'waiting'}
    <svg
      class="state svg-waiting"
      viewBox="0 0 24 24"
    >
      <!-- X mark SVG -->
      <path
        d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
      />
    </svg>
  {:else}
    <svg
      class="state svg-unknown"
      viewBox="0 0 24 24"
    >
      <!-- Question mark SVG (simplified representation) -->
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92c-.65.67-1.17 1.45-1.17 2.83h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.37.59-.88.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
      />
    </svg>
  {/if}
</div>

{#if isCurrentPlayer}
  <div class="text-xs text-center">
    <button on:click={() => (state = 'ready')}>Ready</button>
    <button on:click={() => (state = 'waiting')}>Not Ready</button>
  </div>
{/if}

<style>
  .state {
    width: 50px;
    height: 50px;
    transition:
      transform 0.3s ease-in-out,
      opacity 0.3s ease;
  }
  .main {
    /* make the current player's state larger */
    transform: scale(3.5);
  }
  .svg-ready {
    fill: green;
  }
  .svg-waiting {
    fill: red;
  }
  .svg-unknown {
    fill: gray;
  }
  /* Example animation: scale up on state change */
  .state.change {
    transform: scale(1.5);
    opacity: 0.5;
  }
</style>
