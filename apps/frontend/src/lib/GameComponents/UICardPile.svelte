<script lang="ts">
  import Card from "./UICard.svelte";

  export let pile: any[];

  const pileRotationStep = Math.random() * 5;

  /**
   * Each card in the pile will have a rotation offset
   * this makes the stack look more natural
   */
  const getRotation = (index: number): number => {
    const maxRotation = 5;
    const minRotation = -5;

    return (minRotation + index * pileRotationStep) % maxRotation;
  };
</script>

<div class="card-pile">
  {#each pile as card, index}
    <Card {card} rotation={getRotation(index)} />
  {/each}
</div>

<style>
  /* Cards should be stacked on top of each other */
  /* With the newest covering the last */
  .card-pile {
    position: relative;

    /* Make sure it's large enough to contain the cards rendered below */
    width: 100%;
    height: 100%;

    /* Center the cards */
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
  }
</style>
