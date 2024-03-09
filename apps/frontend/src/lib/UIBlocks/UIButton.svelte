<script>
  export let variant = 'primary';
  export let disabled = false;
  export let onClick = () => {};
</script>

<button
  class="button {variant}"
  {disabled}
  on:click={onClick}
>
  <slot />
</button>

<style>
  .button {
    cursor: pointer;
    border: none; /* Assuming you don't want borders, but add if needed */
    transition: filter 0.25s ease; /* Smooth transition for hover or theme change */
    border-radius: 8px;
    padding: 0.6em 1.2em;
    font-size: 1em;
    font-weight: 500;
    font-family: inherit;
  }
  .button:hover {
    filter: brightness(1.1); /* Slightly brighter on hover */
  }
  .button:focus,
  .button:focus-visible {
    outline: 4px auto -webkit-focus-ring-color;
  }

  .primary {
    background-color: var(--primary-color);
    color: var(--text-color);
  }

  .secondary {
    background-color: var(--secondary-color);
    color: var(--text-color-dark);
  }

  .success {
    background-color: var(--success-color);
    color: var(
      --text-color,
      white
    ); /* Default to white if text-color is not defined */
  }

  .danger {
    background-color: var(--danger-color);
    color: var(--text-color, white);
  }

  .warning {
    background-color: var(--warning-color);
    color: var(--dark-color); /* Dark text for warning to ensure readability */
  }

  .info {
    background-color: var(--info-color);
    color: var(--text-color, white);
  }

  .transparent {
    background-color: transparent;
    color: var(--text-color);
  }

  .button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  /* TODO: Additional styles for hover states could be added here, e.g., */
  /* .button:not(:disabled):hover {} */
</style>
