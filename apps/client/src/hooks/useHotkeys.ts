import { useEffect } from "react";
import { newLogger } from "../logger";

type HotkeyCallback = () => void;
type HotkeyPair = [string, HotkeyCallback];
type IgnoreElement = "INPUT" | "TEXTAREA" | string;

const logger = newLogger("useHotkeys");

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

      logger.debug("Matching hotkey", {
        data: {
          matchingHotkey: matchingHotkey?.[0],
          eventKey: event.key,
        },
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
