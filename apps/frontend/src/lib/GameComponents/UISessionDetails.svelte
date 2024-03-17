<script lang="ts">
  import UiButton from '../UIBlocks/UIButton.svelte';
  import UiModal from '../UIBlocks/UIModal.svelte';

  export let sessionDetails: {
    'Game ID': string;
    'Player Name': string;
  };

  let showDetails = false;
</script>

<UiButton on:click={() => (showDetails = true)}>Session Details</UiButton>

<UiModal
  isOpen={showDetails}
  on:close={() => (showDetails = false)}
>
  <h2>Session Details</h2>
  <ul>
    {#each Object.entries(sessionDetails) as [key, value] (key)}
      <li>
        <strong>{key}:</strong>
        {value}
      </li>
    {/each}
  </ul>
</UiModal>
