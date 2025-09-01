import type React from "react";
import { useGameStore } from "@/store/useGameStore";

/**
 * A collapsible component to display recent game events in a log format.
 * Uses DaisyUI collapse element to provide an expandable/collapsible interface.
 *
 * The component displays the last 5 events from the game state and allows
 * users to toggle visibility. Positioned by parent component (GameBoard).
 *
 * @returns {JSX.Element} The rendered GameEventLog component with collapse functionality.
 */
export const GameEventLog: React.FC = (): JSX.Element => {
	const { gameState } = useGameStore();
	// const { relevantEvent, newLastIndex } = useEventMonitor(
	// 	gameState?.eventLog || [],
	// 	{
	// 		eventTypes: [], // Monitor all event types
	// 		extractProps: (event) => event,
	// 	},
	// 	null,
	// 	-1,
	// );

	const allEventCount = gameState?.eventLog.length || 0;
	const lastN = 5;
	const eventLog = gameState?.eventLog.slice(-lastN, allEventCount) || [];

	if (!gameState) {
		return (
			<div className="collapse collapse-arrow bg-black bg-opacity-50 text-white rounded-lg shadow-lg">
				<input type="checkbox" />
				<div className="collapse-title text-lg font-bold">
					Game Event Log (Loading...)
				</div>
				<div className="collapse-content">
					<div className="text-sm p-2">
						<p>Loading event log...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="collapse collapse-arrow bg-black bg-opacity-50 text-white rounded-lg shadow-lg">
			<input type="checkbox" />
			<div className="collapse-title text-base font-bold">
				Game Event Log ({allEventCount} events)
			</div>
			<div className="collapse-content">
				<div className="max-h-48 overflow-y-auto">
					<ul className="space-y-1 text-sm">
						{eventLog.map((event) => (
							<li
								key={`${event.timestamp}-${event.eventType}-${event.playerId || "system"}`}
								className="border-b border-gray-700 pb-1"
							>
								<span className="font-semibold">
									{event.playerId || "System"}:
								</span>{" "}
								{event.eventType.replace(/_/g, " ").toLowerCase()}
								{event.data && Object.keys(event.data).length > 0 && (
									<pre className="bg-gray-800 p-1 rounded mt-1 text-xs">
										{(() => {
											try {
												return JSON.stringify(event.data, null, 2);
											} catch (error) {
												return `[Error displaying event data: ${error instanceof Error ? error.message : "Unknown error"}]`;
											}
										})()}
									</pre>
								)}
							</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
};
