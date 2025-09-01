import type React from "react";
import { Component, useCallback, useEffect, useReducer, useRef } from "react";
import type { GameAction } from "@oer/shared/types";
import { newLogger } from "@/logger";
import { useApplicationStore } from "../store/useApplicationStore";
import { useGameStore } from "../store/useGameStore";
import {
	useEventMonitor,
	type EventMonitorConfig,
} from "../hooks/useEventMonitor";

const logger = newLogger("TemporaryEventNotification");

/**
 * Configuration for event-triggered notifications
 */
export interface EventNotificationConfig<TProps = Record<string, unknown>>
	extends EventMonitorConfig<TProps> {
	/** Duration to show the notification in milliseconds (default: 3000) */
	showDuration?: number;
	/** Duration of fade out animation in milliseconds (default: 400) */
	fadeDuration?: number;
}

/**
 * Props passed to the rendered notification component
 */
export interface EventNotificationProps<TProps = Record<string, unknown>> {
	/** The game event that triggered this notification */
	event: GameAction;
	/** Whether the notification is currently showing (for animation) */
	isShowing: boolean;
	/** Function to manually dismiss the notification */
	onDismiss: () => void;
	/** Custom props extracted from the event */
	customProps: TProps | null;
}

/**
 * Props for the TemporaryEventNotification component
 */
interface TemporaryEventNotificationProps<TProps = Record<string, unknown>> {
	/** Configuration for event monitoring and behavior */
	config: EventNotificationConfig<TProps>;
	/** Component to render when an event is triggered */
	renderComponent: React.ComponentType<EventNotificationProps<TProps>>;
	/** Optional CSS classes for positioning and styling the container */
	className?: string;
}

// Notification state management
interface NotificationState<TProps> {
	activeNotification: {
		event: GameAction;
		customProps: TProps | null;
		timestamp: number;
	} | null;
	isShowing: boolean;
	lastProcessedIndex: number;
}

type NotificationAction<TProps> =
	| {
			type: "SHOW_NOTIFICATION";
			payload: { event: GameAction; customProps: TProps | null };
	  }
	| { type: "HIDE_NOTIFICATION" }
	| { type: "CLEAR_NOTIFICATION" }
	| { type: "UPDATE_PROCESSED_INDEX"; payload: number };

function notificationReducer<TProps>(
	state: NotificationState<TProps>,
	action: NotificationAction<TProps>,
): NotificationState<TProps> {
	switch (action.type) {
		case "SHOW_NOTIFICATION":
			return {
				...state,
				activeNotification: {
					event: action.payload.event,
					customProps: action.payload.customProps,
					timestamp: action.payload.event.timestamp,
				},
				isShowing: true,
			};
		case "HIDE_NOTIFICATION":
			return {
				...state,
				isShowing: false,
			};
		case "CLEAR_NOTIFICATION":
			return {
				...state,
				activeNotification: null,
				isShowing: false,
			};
		case "UPDATE_PROCESSED_INDEX":
			return {
				...state,
				lastProcessedIndex: action.payload,
			};
		default:
			return state;
	}
}

/**
 * Custom hook for managing notification timers with proper cleanup
 */
function useNotificationTimer() {
	const timersRef = useRef<{
		hide: NodeJS.Timeout | null;
		cleanup: NodeJS.Timeout | null;
	}>({ hide: null, cleanup: null });

	const clearTimers = useCallback(() => {
		if (timersRef.current.hide) {
			clearTimeout(timersRef.current.hide);
			timersRef.current.hide = null;
		}
		if (timersRef.current.cleanup) {
			clearTimeout(timersRef.current.cleanup);
			timersRef.current.cleanup = null;
		}
	}, []);

	const setHideTimer = useCallback(
		(callback: () => void, delay: number) => {
			clearTimers();
			timersRef.current.hide = setTimeout(() => {
				callback();
				timersRef.current.hide = null;
			}, delay);
		},
		[clearTimers],
	);

	const setCleanupTimer = useCallback((callback: () => void, delay: number) => {
		if (timersRef.current.cleanup) {
			clearTimeout(timersRef.current.cleanup);
		}
		timersRef.current.cleanup = setTimeout(() => {
			callback();
			timersRef.current.cleanup = null;
		}, delay);
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return clearTimers;
	}, [clearTimers]);

	return { setHideTimer, setCleanupTimer, clearTimers };
}

/**
 * Generic component for managing temporary event-triggered notifications.
 * Monitors the game event log for specified events and renders a provided component
 * with automatic cleanup and animation support.
 *
 * @example
 * ```tsx
 * const slapConfig = {
 *   eventTypes: [GameActionType.VALID_SLAP, GameActionType.INVALID_SLAP],
 *   filterFn: (event, localPlayer) => event.playerId === localPlayer?.id,
 *   extractProps: (event) => ({ success: event.eventType === GameActionType.VALID_SLAP })
 * };
 *
 * <TemporaryEventNotification
 *   config={slapConfig}
 *   renderComponent={MyNotificationComponent}
 *   className="absolute top-4 right-4"
 * />
 * ```
 */
export const TemporaryEventNotification = <TProps = Record<string, unknown>>({
	config,
	renderComponent: RenderComponent,
	className = "",
}: TemporaryEventNotificationProps<TProps>): JSX.Element | null => {
	const { gameState } = useGameStore();
	const { localPlayer } = useApplicationStore();

	const { showDuration = 3000, fadeDuration = 400 } = config;

	// Use reducer for complex state management
	const [state, dispatch] = useReducer(notificationReducer<TProps>, {
		activeNotification: null,
		isShowing: false,
		lastProcessedIndex: -1,
	});

	// Timer management
	const { setHideTimer, setCleanupTimer, clearTimers } = useNotificationTimer();

	// Monitor events
	const { relevantEvent, newLastIndex } = useEventMonitor(
		gameState?.eventLog,
		config,
		localPlayer,
		state.lastProcessedIndex,
	);

	// Handle new relevant events
	useEffect(() => {
		if (relevantEvent && newLastIndex !== state.lastProcessedIndex) {
			logger.debug("Processing relevant event", {
				data: {
					eventType: relevantEvent.event.eventType,
					hasActiveNotification: !!state.activeNotification,
					isCurrentlyShowing: state.isShowing,
				},
			});

			// Update processed index
			dispatch({ type: "UPDATE_PROCESSED_INDEX", payload: newLastIndex });

			// Show new notification
			dispatch({
				type: "SHOW_NOTIFICATION",
				payload: relevantEvent,
			});

			// Set auto-hide timer
			setHideTimer(() => {
				logger.debug("Auto-hiding notification");
				dispatch({ type: "HIDE_NOTIFICATION" });

				// Set cleanup timer
				setCleanupTimer(() => {
					logger.debug("Cleaning up notification");
					dispatch({ type: "CLEAR_NOTIFICATION" });
				}, fadeDuration);
			}, showDuration);
		} else if (newLastIndex !== state.lastProcessedIndex) {
			// Update index even if no relevant events
			dispatch({ type: "UPDATE_PROCESSED_INDEX", payload: newLastIndex });
		}
	}, [
		relevantEvent,
		newLastIndex,
		state.lastProcessedIndex,
		state.isShowing,
		state.activeNotification,
		showDuration,
		fadeDuration,
		setHideTimer,
		setCleanupTimer,
	]);

	/**
	 * Manually dismiss the notification
	 */
	const handleDismiss = useCallback(() => {
		clearTimers();
		dispatch({ type: "HIDE_NOTIFICATION" });

		// Set cleanup timer for manual dismiss
		setCleanupTimer(() => {
			dispatch({ type: "CLEAR_NOTIFICATION" });
		}, fadeDuration);
	}, [clearTimers, setCleanupTimer, fadeDuration]);

	// Don't render if no active notification
	if (!state.activeNotification) return null;

	return (
		<div className={className}>
			<RenderComponent
				event={state.activeNotification.event}
				isShowing={state.isShowing}
				onDismiss={handleDismiss}
				customProps={state.activeNotification.customProps}
			/>
		</div>
	);
};

/**
 * Error boundary wrapper for notification components
 */
export class NotificationErrorBoundary extends Component<
	{ children: React.ReactNode; fallback?: React.ReactNode },
	{ hasError: boolean }
> {
	constructor(props: {
		children: React.ReactNode;
		fallback?: React.ReactNode;
	}) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): { hasError: boolean } {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
		logger.error("NotificationErrorBoundary caught error", {
			data: {
				error,
				errorInfo,
			},
		});
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback || null;
		}

		return this.props.children;
	}
}

/**
 * Type-safe wrapper for TemporaryEventNotification with error boundary
 */
export function SafeTemporaryEventNotification<
	TProps = Record<string, unknown>,
>(props: TemporaryEventNotificationProps<TProps>): JSX.Element {
	return (
		<NotificationErrorBoundary>
			<TemporaryEventNotification {...props} />
		</NotificationErrorBoundary>
	);
}
