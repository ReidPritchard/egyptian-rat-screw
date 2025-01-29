import { useEffect } from "react";

type HotkeyCallback = () => void;
type HotkeyPair = [string, HotkeyCallback];
type IgnoreElement = "INPUT" | "TEXTAREA" | string;

/**
 * Hook to handle keyboard shortcuts while ignoring specified elements
 * @param hotkeys Array of [hotkey, callback] pairs
 * @param ignoreElements Array of element types to ignore (e.g. ["INPUT", "TEXTAREA"])
 */
export const useHotkeys = (
  hotkeys: HotkeyPair[],
  ignoreElements: Array<IgnoreElement> = []
) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if target is one of the specified elements
      if (
        event.target instanceof Element &&
        ignoreElements.includes(event.target.tagName)
      ) {
        return;
      }

      // Find matching hotkey and execute callback
      const matchingHotkey = hotkeys.find(([key]) => {
        const keyLower = key.toLowerCase();
        const eventKeyLower = event.key.toLowerCase();
        return keyLower === eventKeyLower;
      });

      if (matchingHotkey) {
        event.preventDefault();
        matchingHotkey[1]();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hotkeys, ignoreElements]);
};
