import { useEffect } from "react";
import type { Hotkey } from "@/clientTypes";
import { newLogger } from "../logger";

type HotkeyCallback = () => void;
type HotkeyPair = [Hotkey, HotkeyCallback];
type IgnoreElement = "INPUT" | "TEXTAREA" | string;

const logger = newLogger("useHotkeys");

/**
 * Hook to handle keyboard shortcuts while ignoring specified elements
 * @param hotkeys Array of [hotkey, callback] pairs
 * @param ignoreElements Array of element types to ignore (e.g. ["INPUT", "TEXTAREA"])
 */
export const useHotkeys = (
	hotkeys: HotkeyPair[],
	ignoreElements: Array<IgnoreElement> = [],
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
			const matchingHotkey = hotkeys.find(([hotkey]) => {
				const { key, ctrl, shift, alt, meta } = hotkey;

				// Check if the key matches and modifiers are correct
				return (
					event.key.toLocaleLowerCase() === key.toLocaleLowerCase() &&
					event.ctrlKey === ctrl &&
					event.shiftKey === shift &&
					event.altKey === alt &&
					event.metaKey === meta
				);
			});

			logger.debug("Matching hotkey", {
				data: {
					matchingHotkey: matchingHotkey?.[0],
					eventKey: event.key,
				},
			});

			if (event.key === "?") {
				logger.info(`Hotkeys: ${hotkeys.map(([key]) => key).join(", ")}`);
				return;
			}

			if (matchingHotkey) {
				event.preventDefault();
				matchingHotkey[1]();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [hotkeys, ignoreElements]);
};
