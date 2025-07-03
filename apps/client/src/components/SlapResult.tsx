import { type GameAction, GameActionType } from "@oer/shared/types";
import type React from "react";
import { SlapResultDisplay } from "./SlapResultDisplay";
import {
	type EventNotificationConfig,
	TemporaryEventNotification,
} from "./TemporaryEventNotification";

/**
 * Configuration for invalid slap result notifications
 */
const invalidSlapNotificationConfig: EventNotificationConfig<{
	result: boolean;
	event: GameAction;
}> = {
	eventTypes: [GameActionType.INVALID_SLAP],
	filterFn: (event, localPlayer) => event.playerId === localPlayer?.id,
	showDuration: 500,
	fadeDuration: 400,
	extractProps: (event) => ({
		result: false,
		event: event,
	}),
};

const validSlapNotificationConfig: EventNotificationConfig<{
	result: boolean;
	event: GameAction;
}> = {
	eventTypes: [GameActionType.VALID_SLAP],
	filterFn: (event, localPlayer) =>
		event.playerId === localPlayer?.id ||
		event.data?.rule?.targetPlayerName === localPlayer?.name,
	showDuration: 2000, // Show the notification for longer
	fadeDuration: 400,
	extractProps: (event) => ({
		result: true,
		event: event,
	}),
};

/**
 * Component that displays temporary notifications for slap results.
 * Uses the TemporaryEventNotification system to monitor slap events
 * involving the local player and show success/failure notifications.
 *
 * This component has been refactored to use the generic event notification
 * system, separating event detection logic from display logic.
 */
export const SlapResult: React.FC = () => {
	return (
		<>
			<TemporaryEventNotification
				config={invalidSlapNotificationConfig}
				renderComponent={SlapResultDisplay}
				className="absolute z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
			/>
			<TemporaryEventNotification
				config={validSlapNotificationConfig}
				renderComponent={SlapResultDisplay}
				className="absolute z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
			/>
		</>
	);
};
