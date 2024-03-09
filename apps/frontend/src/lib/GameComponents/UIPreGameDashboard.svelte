<script lang="ts">
  import type { Player } from "@oers/game-core";
  import UiPlayerState from "./UIPlayerState.svelte";

export let playerName: string;
export let playerStates: Player[] = [];
</script>

<div class="player-states">
  <h3>Player States</h3>
  {#each playerStates as player}
    <b>{player.name}:</b>
    <UiPlayerState
      state={player.status}
      isCurrentPlayer={player.name === playerName}
    />
  {/each}
</div>

<style>
  .player-states {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    margin-bottom: 1rem;
  }
</style>
