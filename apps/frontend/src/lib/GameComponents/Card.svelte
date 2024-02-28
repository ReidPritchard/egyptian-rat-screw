<script lang="ts">
  import type { Card } from "@oers/game-core";

  export let card: Card;
</script>

<div class="card">
  <div class="card-value">{card.value}</div>
  <div class="card-suit">{card.suit}</div>
</div>

<style>
  .card {
    border: 1px solid black;
    padding: 10px;
    margin: 10px;
  }
  .card-value,
  .card-suit {
    text-align: center;
  }
</style>
