<script lang="ts">
  import type { Card } from '@oers/game-core';
  import { elasticOut } from 'svelte/easing';
  import { playCard } from '../../utils/transitions';

  export let card: Card | undefined;
  export let rotation: number = 0;

  // Reactive statement for dynamic style including rotation
  $: transformedStyle = `transform: rotate(${rotation}deg);`;

  const displayValue = (): string => card?.rank || 'Unknown';
  const displaySuit = (): string => card?.suit || 'Unknown';

  const suitToSymbol = (suit: string): string => {
    switch (suit) {
      case 'hearts':
        return '♥';
      case 'diamonds':
        return '♦';
      case 'clubs':
        return '♣';
      case 'spades':
        return '♠';
      default:
        return '?';
    }
  };
</script>

{#if card}
  <div
    class="card"
    in:playCard={{ duration: 600 }}
    style={transformedStyle}
    role="img"
    aria-label="{card.rank} of {card.suit}"
  >
    <div class="card-content">
      <div class="card-value {card.rank}">{displayValue()}</div>
      <div class="card-suit {card.suit}">{suitToSymbol(displaySuit())}</div>
    </div>
  </div>
{/if}

<style>
  :root {
    --card-width: 50%;
    --card-aspect-ratio: 2.5 / 3.5;
    --card-border-radius: 20px;
    --card-padding: 10px;
    --card-margin: 10px;
    --card-color: white;
    --card-border-color: black;
    --card-text-color: black;
    --card-heart-diamond-color: red;
  }

  .card {
    position: absolute; /* Changed from absolute to relative for better layout handling */
    width: var(--card-width);
    aspect-ratio: var(--card-aspect-ratio);
    border: 2px solid var(--card-border-color);
    border-radius: var(--card-border-radius);
    padding: var(--card-padding);
    margin: var(--card-margin);
    background-color: var(--card-color);
    transition: transform 0.3s ease;
    display: flex; /* Using flex for better control of content alignment */
    justify-content: center;
    align-items: center;
  }

  .card:hover {
    transform: scale(1.05);
  }

  .card-value,
  .card-suit {
    text-align: center;
    color: var(
      --card-text-color
    ); /* Using a variable for text color for easier theme changes */
  }

  .hearts,
  .diamonds {
    color: var(
      --card-heart-diamond-color
    ); /* Differentiates heart and diamond suits by color */
  }
</style>
