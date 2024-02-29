<script>
  export let variant = "primary";
  export let disabled = false;
  export let onClick = () => {};
</script>

<button class="button {variant}" {disabled} on:click={onClick}>
  <slot />
</button>

<style>
  .button {
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 16px;
    cursor: pointer;
  }

  .primary {
    background-color: #007bff;
    color: white;
  }

  .secondary {
    background-color: #6c757d;
    color: white;
  }

  .success {
    background-color: #28a745;
    color: white;
  }

  .danger {
    background-color: #dc3545;
    color: white;
  }

  .warning {
    background-color: #ffc107;
    color: black;
  }

  .info {
    background-color: #17a2b8;
    color: white;
  }

  .light {
    background-color: #f8f9fa;
    color: black;
  }

  .dark {
    background-color: #343a40;
    color: white;
  }

  .button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
</style>
