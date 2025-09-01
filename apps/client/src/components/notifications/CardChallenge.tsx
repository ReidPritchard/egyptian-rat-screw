import React from "react";
import {
	EventNotificationConfig,
	EventNotificationProps,
	TemporaryEventNotification,
} from "../TemporaryEventNotification";
import { GameActionType } from "@oer/shared/types";

/**
 * Props for the CardChallengeDisplay component.
 */
interface SlapResultProps {
	/** The player's name who initiated the challenge */
	challengerName: string;
	/** The player’s name who is being challenged */
	challengedName: string;
	/** The card rank that initiated the challenge (e.g., "Ace", "King") */
	cardRank: string;
	/** How many attempts/cards the challenged player has to respond */
	attemptsLeft: number;
	/** Whether the challenge was successful (true) or failed (false) */
	challengeResult?: "success" | "failure";
}

type SlapResultDisplayProps = EventNotificationProps<SlapResultProps>;

/**
 * A component to display a temporary notification for Card Challenges.
 */
export const CardChallengeDisplay: React.FC<SlapResultDisplayProps> = ({
	customProps,
	isShowing,
	onDismiss,
}) => {
	if (!customProps) {
		return null;
	}

	const {
		challengerName,
		challengedName,
		cardRank,
		attemptsLeft,
		challengeResult,
	} = customProps;

	let message: string;

	// Determine the message based on the challenge result
	if (challengeResult === "success") {
		message = `${challengerName} successfully challenged ${challengedName}!`;
	} else if (challengeResult === "failure") {
		message = `${challengedName} defended the challenge! ${challengerName} picks up the pile.`;
	} else {
		message = `${challengerName} has challenged ${challengedName} on a ${cardRank}! ${challengedName} has ${attemptsLeft} attempt(s) left to respond.`;
	}

	return (
		<div
			className={`${
				isShowing ? "opacity-100" : "opacity-0"
			} transition-opacity duration-500 ease-in-out fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-xs text-center`}
			role="alert"
		>
			<p className="text-sm">{message}</p>
			{challengeResult && (
				<p className="mt-2 text-xs text-gray-500">Click to dismiss</p>
			)}
		</div>
	);
};

/**
 * Configuration for invalid slap result notifications
 */
const cardChallengeConfiguration: EventNotificationConfig<{
	challengerName: string;
	challengedName: string;
	cardRank: string;
	attemptsLeft: number;
	challengeResult?: "success" | "failure";
}> = {
	eventTypes: [
		GameActionType.START_CHALLENGE,
		GameActionType.WIN_FACE_CARD_CHALLENGE,
		GameActionType.LOSE_FACE_CARD_CHALLENGE,
		GameActionType.COUNTER_FACE_CARD_CHALLENGE,
	],
	filterFn: (_event, _localPlayer) => true,
	showDuration: undefined, // Show until dismissed
	fadeDuration: 400,
	extractProps: (event) => ({
		// Event data structure (for start challenge):
		// card,
		// initiator: challengerInfo,
		// activePlayerId: nextPlayerId,
		// faceCardRank: card.rank,
		// cardsToPlay: faceCardCount,
		// cardsPlayed: 0,

		// Map event data to the props expected by CardChallengeDisplay
		challengerName: event.data?.initiator?.name ?? "Unknown",
		challengedName: event.data?.activePlayerName ?? "Unknown",
		cardRank: event.data?.faceCardRank ?? "Unknown",
		attemptsLeft: event.data?.cardsToPlay ?? 0,
		// For win/lose challenge events, we don't have attemptsLeft
		// but we do know the result.
		challengeResult:
			event.eventType === GameActionType.WIN_FACE_CARD_CHALLENGE
				? "success"
				: event.eventType === GameActionType.LOSE_FACE_CARD_CHALLENGE
					? "failure"
					: undefined,
	}),
};

/**
 * The temporary even notification component wrapper
 * for the CardChallengeDisplay.
 */
export const CardChallengeNotification: React.FC = () => {
	return (
		<TemporaryEventNotification
			config={cardChallengeConfiguration}
			renderComponent={CardChallengeDisplay}
			className="absolute z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
		/>
	);
};
