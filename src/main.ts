import './colors.css';
import './app.css';
import App from './App.svelte';

const target = document.getElementById('app');

if (!target) {
  throw new Error('Could not find the "app" element in the DOM');
}

document.title = 'Egyptian Rat Screw';

const app = new App({
  target,
});

export default app;
