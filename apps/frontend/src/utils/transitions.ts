import { cubicOut, elasticOut } from 'svelte/easing';

export function expand(
  node: Element,
  {
    delay = 0,
    duration = 400,
    easing = cubicOut,
  }: {
    delay?: number;
    duration?: number;
    easing?: (t: number) => number;
  } = {}
) {
  const w = parseFloat(getComputedStyle(node).strokeWidth || '0');

  return {
    delay,
    duration,
    easing,
    css: (t: number) => `opacity: ${t}; stroke-width: ${t * w}`,
  };
}

/**
 * Transition for a card being played
 * @param node
 * @param options
 */
export function playCard(
  node: Element,
  {
    delay = 0,
    duration = 600,
    easing = elasticOut,
  }: {
    delay?: number;
    duration?: number;
    easing?: (t: number) => number;
  } = {}
) {
  // The card is being played (or placed on the top of the pile)
  // The card should move from off screen then "flip" above the pile

  const w = parseFloat(getComputedStyle(node).strokeWidth || '0');
  const h = parseFloat(getComputedStyle(node).height || '0');
  const y = parseFloat(getComputedStyle(node).y || '0');

  return {
    delay,
    duration,
    easing,
    css: (t: number) =>
      `opacity: ${t}; height: ${t * h}; y: ${y - t * h}; transform: rotate(${t * 180}deg);`,
  };
}

/**
 * Transition function to animate the card being added to the pile, including rotation
 * @param {HTMLElement} node
 * @param {{ delay?: number, duration?: number, easing?: (t: number) => number }} params
 */
export function playCardTransition(
  node: HTMLElement,
  { delay = 0, duration = 400, easing = elasticOut } = {}
) {
  const existingTransform =
    getComputedStyle(node).transform === 'none'
      ? ''
      : getComputedStyle(node).transform;

  return {
    delay,
    duration,
    easing,
    css: (t: number) =>
      `${existingTransform} scale(${t}) translateZ(0); transform: scale(${t}) translateZ(0);`,
  };
}
