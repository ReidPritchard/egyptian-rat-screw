<script lang="ts">
  import Card from "./UICard.svelte";

  export let pile: any[];
</script>

<div class="card-pile">
  {#each pile as card}
    <Card {card} />
  {/each}
</div>
