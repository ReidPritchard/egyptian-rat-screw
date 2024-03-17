<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import UiButton from '../UIBlocks/UIButton.svelte';

  /**
   * Represents the time the countdown should count to
   * Often the time the game will start
   */
  export let startTime: Date;

  interface CountdownEvents {
    countdownFinished: void;
    countdownCancelled: void;
  }

  const dispatch = createEventDispatcher<CountdownEvents>();
  const interval = 1000;
  let timeLeft = calculateTimeLeft();

  // Initialize the interval and regularly update `timeLeft`
  const countdownInterval = setInterval(() => {
    timeLeft = calculateTimeLeft(); // This update triggers Svelte reactivity

    if (timeLeft <= 0) {
      clearInterval(countdownInterval);
      dispatch('countdownFinished');
    }
  }, interval);

  function calculateTimeLeft(): number {
    return Math.max(
      0,
      Math.floor((startTime.getTime() - new Date().getTime()) / interval)
    );
  }

  function cancelCountdown() {
    dispatch('countdownCancelled');
    clearInterval(countdownInterval);
  }

  onDestroy(() => {
    clearInterval(countdownInterval);
  });
</script>

{#if timeLeft > 0}
  <h1 aria-live="polite">{timeLeft}...</h1>
{:else}
  <h1 aria-live="assertive">Time's up!</h1>
{/if}

<UiButton
  disabled={timeLeft <= 0}
  variant="danger"
  on:click={cancelCountdown}
>
  Cancel
</UiButton>

<style>
  h1 {
    font-size: 3rem;
    text-align: center;
  }
</style>
