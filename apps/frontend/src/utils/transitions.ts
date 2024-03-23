import { cubicOut, elasticOut, quintOut } from 'svelte/easing';
import {
  crossfade,
  fade,
  type CrossfadeParams,
  type TransitionConfig,
} from 'svelte/transition';

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
  {
    delay = 0,
    duration = 400,
    easing = elasticOut,
  }: { delay?: number; duration?: number; easing?: (t: number) => number } = {}
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

export function typewriter(
  node: HTMLElement,
  { speed = 1 }: { speed?: number }
) {
  const valid =
    node.childNodes.length === 1 &&
    node.childNodes[0].nodeType === Node.TEXT_NODE;

  if (!valid) {
    throw new Error(
      `This transition only works on elements with a single text node child`
    );
  }

  const text = node.textContent;

  if (text === null) {
    throw new Error(`The 'text' variable is null`);
  }

  const duration = text.length / (speed * 0.01);

  return {
    duration,
    tick: (t: number) => {
      const i = ~~(text.length * t);
      node.textContent = text.slice(0, i);
    },
  };
}
export type TransitionParams = {
  fallback: (
    node: Element,
    params: CrossfadeParams,
    intro: boolean
  ) => TransitionConfig;
  [key: string]: any;
};

// Defines a simplified crossfade transition.
export function simplifiedCrossfade({
  fallback,
  ...defaults
}: TransitionParams) {
  const toReceive = new Map<any, Element>();
  const toSend = new Map<any, Element>();

  // Creates a crossfade transition between elements.
  function crossfade(
    fromNode: Element,
    toNode: Element,
    params: CrossfadeParams
  ): TransitionConfig {
    const {
      delay = 0,
      duration = (d: number) => Math.sqrt(d) * 30,
      easing = cubicOut,
    } = { ...defaults, ...params };

    const opacity = +getComputedStyle(toNode).opacity;

    return {
      delay,
      duration: typeof duration === 'function' ? duration(opacity) : duration,
      easing,
      css: (t: number) => `opacity: ${t * opacity};`,
    };
  }

  // Handles the transition for a collection of elements.
  function transition(
    items: Map<any, Element>,
    counterparts: Map<any, Element>,
    intro: boolean
  ): (
    node: any,
    params: CrossfadeParams & { key: any }
  ) => () => TransitionConfig {
    return (node, params) => {
      items.set(params.key, node);

      return () => {
        if (counterparts.has(params.key)) {
          const otherNode = counterparts.get(params.key);
          counterparts.delete(params.key);

          if (otherNode) {
            return crossfade(otherNode, node, params);
          }
        }

        items.delete(params.key);
        return fallback(node, params, intro);
      };
    };
  }

  return [
    transition(toSend, toReceive, false),
    transition(toReceive, toSend, true),
  ];
}
