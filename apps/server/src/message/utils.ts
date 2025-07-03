import type { EventData } from "@oer/message";
import type { WebSocket } from "ws";

export const parseMessage = (
	data: WebSocket.RawData,
): {
	event: string;
	data: EventData;
} => {
	try {
		return JSON.parse(data.toString());
	} catch (error) {
		return {
			event: "error",
			data: {
				message: "Error parsing message",
				error: error instanceof Error ? error.message : String(error),
			},
		};
	}
};
