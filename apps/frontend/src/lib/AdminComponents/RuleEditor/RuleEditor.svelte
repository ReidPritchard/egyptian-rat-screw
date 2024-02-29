<script>
  import Rule from "../EditorRule.svelte";

  export let rules = [{ id: 1, name: "Rule 1", condition: "", action: "" }];

  function addRule() {
    const newRule = {
      id: rules.length + 1,
      name: `Rule ${rules.length + 1}`,
      condition: "",
      action: "",
    };
    rules = [...rules, newRule];
  }

  function removeRule(ruleId) {
    rules = rules.filter((rule) => rule.id !== ruleId);
  }
</script>

<main>
  <h1>Rule Editor</h1>
  <button on:click={addRule}>Add Rule</button>
  {#each rules as rule (rule.id)}
    <Rule {rule} on:remove={removeRule} />
  {/each}
</main>

<style>
  main {
    max-width: 600px;
    margin: auto;
    padding: 1rem;
  }
</style>
