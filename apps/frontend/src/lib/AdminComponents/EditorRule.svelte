<script lang="ts">
  import type { Rule } from "@oers/game-core";

  export let rule: Rule;

  // Dispatch a custom event to signal rule removal
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  function handleRemove() {
    dispatch("remove", rule.id);
  }
</script>

<div class="rule">
  <input bind:value={rule.name} placeholder="Rule Name" />
  <textarea bind:value={rule.condition} placeholder="Condition"></textarea>
  <textarea bind:value={rule.action} placeholder="Action"></textarea>
  <button on:click={handleRemove}>Remove</button>
</div>

<style>
  .rule {
    margin-bottom: 1rem;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  input,
  textarea {
    width: 100%;
    margin-bottom: 0.5rem;
  }
  textarea {
    height: 80px;
  }
</style>
