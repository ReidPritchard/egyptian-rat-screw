import type { GameAction, GameActionType, PlayerInfo } from "@oer/shared/types";
import { useMemo } from "react";
import { newLogger } from "@/logger";

const logger = newLogger("useEventMonitor");

/**
 * Configuration for event monitoring
 */
export interface EventMonitorConfig<TProps = Record<string, unknown>> {
	/** Array of event types to monitor (empty array matches all event types) */
	eventTypes: GameActionType[];
	/** Optional filter function to determine if an event should be processed */
	filterFn?: (event: GameAction, localPlayer: PlayerInfo | null) => boolean;
	/** Function to extract custom props from the event */
	extractProps: (event: GameAction) => TProps;
}

/**
 * Return type for useEventMonitor hook
 */
export interface EventMonitorResult<TProps = Record<string, unknown>> {
	/** The most recent relevant event with extracted props, or null if none */
	relevantEvent: {
		event: GameAction;
		customProps: TProps | null;
	} | null;
	/** The new last processed index */
	newLastIndex: number;
}

/**
 * Custom hook for monitoring game events based on configuration criteria.
 * 
 * This hook processes new events from the game event log since the last processed index,
 * filters them based on event types and optional filter function, and extracts custom
 * properties from the most recent relevant event.
 * 
 * @param eventLog - Array of game actions from the event log
 * @param config - Configuration specifying which events to monitor and how to process them
 * @param localPlayer - Current local player information for filtering
 * @param lastProcessedIndex - Index of the last processed event to avoid reprocessing
 * @returns Object containing the most recent relevant event with extracted props and new processed index
 * 
 * @example
 * ```tsx
 * const config = {
 *   eventTypes: [GameActionType.VALID_SLAP, GameActionType.INVALID_SLAP],
 *   filterFn: (event, localPlayer) => event.playerId === localPlayer?.id,
 *   extractProps: (event) => ({ success: event.eventType === GameActionType.VALID_SLAP })
 * };
 * 
 * const { relevantEvent, newLastIndex } = useEventMonitor(
 *   gameState?.eventLog,
 *   config,
 *   localPlayer,
 *   lastProcessedIndex
 * );
 * ```
 */
export function useEventMonitor<TProps = Record<string, unknown>>(
	eventLog: GameAction[] | undefined,
	config: EventMonitorConfig<TProps>,
	localPlayer: PlayerInfo | null,
	lastProcessedIndex: number,
): EventMonitorResult<TProps> {
	const { eventTypes, filterFn, extractProps } = config;

	return useMemo(() => {
		if (!eventLog?.length) {
			return { relevantEvent: null, newLastIndex: lastProcessedIndex };
		}

		// Get all new events since the last processed index
		const newEvents = eventLog.slice(lastProcessedIndex + 1);
		if (newEvents.length === 0) {
			return { relevantEvent: null, newLastIndex: lastProcessedIndex };
		}

		// Find the most recent event that matches our criteria
		const relevantEvents = newEvents.filter((event) => {
			try {
				const isMonitoredEvent = eventTypes.length === 0 || eventTypes.includes(event.eventType);
				const passesFilter = !filterFn || filterFn(event, localPlayer);
				return isMonitoredEvent && passesFilter;
			} catch (error) {
				logger.error("Error filtering event", {
					data: { error, event },
				});
				return false;
			}
		});

		const latestRelevantEvent =
			relevantEvents[relevantEvents.length - 1] || null;
		const customProps = latestRelevantEvent
			? extractProps(latestRelevantEvent)
			: null;

		return {
			relevantEvent: latestRelevantEvent
				? { event: latestRelevantEvent, customProps }
				: null,
			newLastIndex: eventLog.length - 1,
		};
	}, [
		eventLog,
		eventTypes,
		filterFn,
		extractProps,
		localPlayer,
		lastProcessedIndex,
	]);
}