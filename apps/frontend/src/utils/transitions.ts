import { cubicOut } from 'svelte/easing';

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
