<script lang="ts">
  import Card from "./Card.svelte";

  export let pile: any[];
</script>

<div class="card-pile">
  {#each pile as card}
    <Card {card} />
  {/each}
</div>
