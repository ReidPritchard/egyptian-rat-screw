import { GameActionType, type VoteState } from "@oer/shared/types";
import { newLogger } from "../logger.js";
import type { GameCore } from "./GameCore.js";
import type { GameEventLogger } from "./GameEventLogger.js";
import type { GameNotifier } from "./GameNotifier.js";

const logger = newLogger("VotingSystem");

/**
 * Manages in-game voting functionality
 */
export class VotingSystem {
	private gameCore: GameCore;
	private eventLogger: GameEventLogger;
	private notifier: GameNotifier;
	private voteState: VoteState | null = null;

	constructor(
		gameCore: GameCore,
		eventLogger: GameEventLogger,
		notifier: GameNotifier,
	) {
		this.gameCore = gameCore;
		this.eventLogger = eventLogger;
		this.notifier = notifier;
	}

	/**
	 * Start a new vote
	 */
	public startVote(topic: string): void {
		if (this.voteState) {
			this.notifier.emitError("A vote is already in progress.");
			return;
		}

		this.voteState = {
			topic,
			votes: [],
			startTime: Date.now(),
		};

		// Log the vote start event
		this.eventLogger.logEvent({
			playerId: "", // System event
			eventType: GameActionType.START_VOTE,
			timestamp: Date.now(),
			data: { topic },
		});

		this.notifier.emitGameUpdate(this.gameCore.getGameState());
	}

	/**
	 * Submit a player's vote
	 */
	public submitVote(playerId: string, vote: boolean): void {
		if (!this.voteState) {
			this.notifier.emitError("No vote in progress.");
			return;
		}

		this.voteState.votes.push({ playerId, vote });

		// Log the vote submission event
		this.eventLogger.logEvent({
			playerId,
			eventType: GameActionType.SUBMIT_VOTE,
			timestamp: Date.now(),
			data: { vote },
		});

		// Check if all players have voted
		if (this.voteState.votes.length === this.gameCore.getPlayerCount()) {
			this.resolveVote();
		}

		this.notifier.emitGameUpdate(this.gameCore.getGameState());
	}

	/**
	 * Resolve the current vote
	 */
	private resolveVote(): void {
		if (!this.voteState) return;

		const voteCount = {
			yes: 0,
			no: 0,
		};

		for (const vote of this.voteState.votes) {
			vote.vote ? voteCount.yes++ : voteCount.no++;
		}

		const passed = voteCount.yes > voteCount.no;

		// Log the vote resolution event
		this.eventLogger.logEvent({
			playerId: "", // System event
			eventType: GameActionType.RESOLVE_VOTE,
			timestamp: Date.now(),
			data: { voteCount, passed },
		});

		this.notifier.emitVoteResolved(this.voteState.topic, voteCount, passed);

		this.voteState = null;
		this.notifier.emitGameUpdate(this.gameCore.getGameState());
	}

	/**
	 * Get the current vote state
	 */
	public getVoteState(): VoteState | null {
		return this.voteState;
	}

	/**
	 * Reset the voting system
	 */
	public reset(): void {
		this.voteState = null;
	}
}
