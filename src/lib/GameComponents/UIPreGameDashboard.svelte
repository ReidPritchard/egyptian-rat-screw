<script lang="ts">
  import type { Player } from '@oers/game-core';
  import UiPlayerState from './UIPlayerState.svelte';

  export let playerName: string;
  export let playerStates: Partial<Player>[] = [];

  let otherPlayers: Partial<Player>[] = [];
  let ourState: Partial<Player> | undefined = playerStates.find(
    (player) => player.name === playerName
  );

  $: otherPlayers = playerStates.filter((player) => player.name !== playerName);
  $: ourState = playerStates.find((player) => player.name === playerName);
</script>

{#if ourState}
  <h3>Your State</h3>
  <UiPlayerState
    state={ourState.status}
    isCurrentPlayer={true}
    on:stateChange
  />
{/if}

<div class="player-states">
  {#each otherPlayers as player}
    <div class="player-state">
      <b>{player.name}</b>
      <UiPlayerState
        state={player.status}
        isCurrentPlayer={false}
      />
    </div>
  {/each}
</div>

<style>
  .player-states {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    margin-bottom: 1rem;
  }

  .player-state {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
</style>
