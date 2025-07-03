import {
	type GameAction,
	type SlapRule,
	SlapRuleAction,
} from "@oer/shared/types";
import { IconCheck, IconX } from "@tabler/icons-react";
import type React from "react";
import type { EventNotificationProps } from "./TemporaryEventNotification";

/**
 * Props specific to slap result notifications
 */
interface SlapResultProps {
	/** Whether the slap was valid (true) or invalid (false) */
	result: boolean;
	/** The game action that triggered the notification */
	event: GameAction;
}

/**
 * Component props combining event notification props with slap-specific props
 */
type SlapResultDisplayProps = EventNotificationProps<SlapResultProps>;

/**
 * Display component for slap result notifications.
 * Shows a success or error alert with appropriate messaging and animations.
 * This component only handles rendering - event detection is managed by TemporaryEventNotification.
 */
export const SlapResultDisplay: React.FC<SlapResultDisplayProps> = ({
	event,
	isShowing,
	customProps,
	onDismiss,
}) => {
	const result = customProps?.result ?? false;
	// If the slap was valid, use the data to get the rule that was
	// correctly applied.
	const rule: SlapRule | undefined = event.data?.rule;
	const ruleName = rule?.name;
	const action = rule?.action;
	// const targetPlayerName = rule?.targetPlayerName;

	const prettyAction = (action: SlapRuleAction | undefined) => {
		if (!action) {
			return undefined;
		}

		switch (action) {
			case SlapRuleAction.TAKE_PILE:
				return "Take the pile";
			case SlapRuleAction.SKIP:
				return "Skipped";
			default:
				return action;
		}
	};

	return (
		<div
			className={`transition-all duration-400 ease-in-out ${
				isShowing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
			}`}
		>
			{result ? (
				// Big green check
				<>
					{/* Rule info */}
					{prettyAction(action) && (
						<div className="text-2xl font-bold text-center">
							{prettyAction(action)}
						</div>
					)}
					<div className="text-xl font-bold text-center mb-4">
						{ruleName && `(${ruleName})`}
					</div>

					<IconCheck
						size={450}
						className="text-green-500"
					/>
				</>
			) : (
				// Big red X
				<IconX
					size={500}
					className="text-red-500"
				/>
			)}
		</div>
	);
};
