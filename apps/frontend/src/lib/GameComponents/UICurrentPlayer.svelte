<script lang="ts">
export let playerName: string;
</script>

{#if playerName}
<div class="current-player">
  <div class="player-name">{playerName}</div>
</div>
{/if}

<style>
  .current-player {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 1rem;
  }

  .player-name {
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    background-color: var(--primary);
    color: var(--white);
  }
</style>
