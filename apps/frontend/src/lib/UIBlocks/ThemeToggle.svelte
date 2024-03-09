<script lang="ts">
  import sun from '../../assets/sun.svg';
  import moon from '../../assets/moon.svg';
  import { localStorageStore } from '../../stores/storable';
  import UiButton from './UIButton.svelte';

  // This function toggles the class on the body
  function toggleColorScheme(enableDarkMode: boolean | undefined) {
    document.body.classList.toggle('dark', enableDarkMode);
    document.body.classList.toggle('light', !enableDarkMode);
  }

  // Initial check for system preference or previously set preference
  let darkMode =
    localStorageStore.getItem('darkMode') ??
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  // Listen for changes in system theme preference
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      darkMode = e.matches;
    });

  // Svelte reactive statement to apply the theme
  $: toggleColorScheme(darkMode);

  // Function to manually toggle dark mode
  function switchTheme() {
    darkMode = !darkMode;
    localStorageStore.setItem('darkMode', darkMode);
  }
</script>

<UiButton
  on:click={switchTheme}
  variant="transparent"
>
  <div class="icon">
    <img
      src={moon}
      alt="Switch to Dark Mode"
      class="icon-moon"
    />
    <img
      src={sun}
      alt="Switch to Light Mode"
      class="icon-sun"
    />
  </div>
</UiButton>

<style>
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon-moon,
  .icon-sun {
    display: none;
    height: 2em;
    padding: 0.25em;
  }

  .icon-sun {
    /* TODO: Update the svg to use the color scheme css variables */
    filter: invert(1);
  }

  :global(.dark) .icon-sun,
  :global(.light) .icon-moon {
    display: block;
  }
</style>
