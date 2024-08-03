<script>
  import { createEventDispatcher } from 'svelte';
  import UiButton from './UIButton.svelte';

  export let isOpen = false;

  const dispatch = createEventDispatcher();

  function close() {
    isOpen = false;
    dispatch('close');
  }
</script>

<svelte:window on:keydown={(e) => e.key === 'Escape' && close()} />

{#if isOpen}
  <div
    class="modal"
    class:open={isOpen}
  >
    <div class="modal-content">
      <slot />
      <UiButton
        on:click={close}
        variant="secondary">Close</UiButton
      >
    </div>
  </div>
{/if}

<style>
  .modal {
    display: none;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgba(0, 0, 0, 0.4);
  }

  .modal-content {
    background-color: var(--background-color);
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
  }

  .modal.open {
    display: block;
  }
</style>
