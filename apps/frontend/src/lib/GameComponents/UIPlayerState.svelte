<script lang="ts">
  import type { PlayerStatus } from "@oers/game-core";
  import { fade } from "svelte/transition";

  // Reactive state store
  let state: PlayerStatus = "unknown";

  // Function to update state
  function updateState(newState: PlayerStatus) {
    state = newState;
  }

  // Determine the display character based on state
  $: displayChar = state === "ready" ? "✓" : state === "waiting" ? "X" : "?";
</script>

<div transition:fade={{ duration: 300 }}>
  <span class="state" class:change={state !== "unknown"}>{displayChar}</span>
</div>

<!-- Example buttons to change state -->
<button on:click={() => updateState("ready")}>Ready</button>
<button on:click={() => updateState("waiting")}>Not Ready</button>
<button on:click={() => updateState("unknown")}>Unknown</button>

<style>
  .state {
    font-size: 24px;
    transition: transform 0.3s ease-in-out;
  }
  .state.change {
    transform: scale(1.5);
  }
</style>
