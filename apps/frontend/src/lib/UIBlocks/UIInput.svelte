<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let placeholder = '';
  export let label = '';
  // No matter the type, the value will always be a string
  export let type: 'text' | 'password' | 'email' | 'number' = 'text';

  const dispatch = createEventDispatcher();

  let value = '';
  let isValid = true;

  $: {
    switch (type) {
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        break;
      case 'password':
        isValid = value.length >= 8; // Simple validation for password length
        break;
      case 'number':
        isValid = !isNaN(Number(value));
        break;
      default:
        isValid = value.length > 0;
    }
  }

  $: if (value !== undefined) {
    dispatch('input', {
      value,
      isValid,
    });
  }
</script>

{#if type === 'password'}
  <label for="input-field">{label}</label>
  <input
    id="input-field"
    type="password"
    bind:value
    {placeholder}
    aria-label={placeholder}
    class:invalid={!isValid}
  />
{:else if type === 'email'}
  <label for="input-field">{label}</label>
  <input
    id="input-field"
    type="email"
    bind:value
    {placeholder}
    aria-label={placeholder}
    class:invalid={!isValid}
  />
{:else if type === 'number'}
  <label for="input-field">{label}</label>
  <input
    id="input-field"
    type="number"
    bind:value
    {placeholder}
    aria-label={placeholder}
    class:invalid={!isValid}
  />
{:else}
  <label for="input-field">{label}</label>
  <input
    id="input-field"
    type="text"
    bind:value
    {placeholder}
    aria-label={placeholder}
    class:invalid={!isValid}
  />
{/if}

<style>
  input {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    font-size: 16px;
    border-radius: 4px;
    border: 1px solid var(--accent-color);

    background-color: var(--background-color);
    color: var(--text-color);

    transition: border-color 0.25s ease;

    &::placeholder {
      color: var(--text-color-light);
    }
  }

  /* Hover State */
  input:hover {
    border-color: var(--accent-color-hover);
  }

  /* Focus State */
  input:focus {
    border-color: var(--accent-color-light);
    box-shadow: 0 0 0 2px var(--accent-color-dark);
  }

  .invalid {
    border-color: var(--error-color);
  }
</style>
