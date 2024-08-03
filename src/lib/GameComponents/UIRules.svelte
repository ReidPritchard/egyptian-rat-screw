<script lang="ts">
  import type { SlapRule } from '@oers/game-core';
  import UiButton from '../UIBlocks/UIButton.svelte';
  import UiModal from '../UIBlocks/UIModal.svelte';

  // The slap rules for the game
  export let slapRules: SlapRule[] = [];

  // Whether to show the rules or not
  let showRules = false;

  // Whether to show the description of a rule or not
  let showRulesDescription = new Array(slapRules.length).fill(false);

  // Function to toggle the visibility of the rules
  const toggleRules = (): void => {
    showRules = !showRules;

    // If the rules are being shown, hide all the rule descriptions
    if (showRules) {
      showRulesDescription.fill(false);
    }
  };

  // Function to toggle the visibility of a rule's description
  const toggleRuleDescription = (index: number): void => {
    showRulesDescription[index] = !showRulesDescription[index];
  };
</script>

<!-- Rules will be a collapsable component -->
<!-- It will display the rules of the game -->

<div id="rules">
  <UiButton on:click={toggleRules}>
    {showRules ? 'Hide' : 'Show'} Rules
  </UiButton>

  {#if showRules}
    <UiModal
      isOpen={showRules}
      on:close={toggleRules}
    >
      <ul>
        <!-- Display each rule with its name -->
        {#each slapRules as { name }, index (index)}
          <!-- Clicking on the rule name should toggle displaying it's description -->
          <li>
            <strong>{index + 1}.</strong>
            {name}
            <UiButton
              size="small"
              on:click={() => toggleRuleDescription(index)}
            >
              {showRulesDescription[index] ? 'Hide' : 'Show'} Description
            </UiButton>
            {#if showRulesDescription[index]}
              <p>{slapRules[index].description}</p>
            {/if}
          </li>
        {/each}
      </ul>
    </UiModal>
  {/if}
</div>

<style>
  button {
    background-color: var(--accent-color);
    border: none;
    color: var(--light-color);
    padding: 10px 10px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
  }

  button.small {
    background-color: var(--dark-color);
    color: var(--accent-color);
    padding: 5px 5px;
    font-size: 12px;
  }

  ul {
    list-style-type: none;
    padding: 0;
  }

  li {
    padding: 8px 16px;
    border-bottom: 1px solid #ddd;
  }

  li:last-child {
    border-bottom: none;
  }
</style>
