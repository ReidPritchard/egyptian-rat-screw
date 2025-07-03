import {
	IconArrowRight,
	IconId,
	IconPlus,
	IconUser,
} from "@tabler/icons-react";
import { type ChangeEvent, useEffect, useId, useState } from "react";
import { config } from "../config";
import { useApi } from "../contexts/ApiContext";
import { useLocalPlayerSettings } from "../hooks/useLocalPlayerSettings";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { newLogger } from "../logger";
import { useApplicationStore } from "../store/useApplicationStore";
import { useLobbyStore } from "../store/useLobbyStore";

const logger = newLogger("Lobby");

export const Lobby = () => {
	const { changeName } = useLocalPlayerSettings();
	const { lobbyState, lobbyPlayers, handleJoinGame, handleCreateGame } =
		useLobbyStore();
	const { localPlayer } = useApplicationStore();
	const api = useApi();

	const playerNameInputID = useId();
	const createGameButtonID = useId();

	const [playerName, setPlayerName] = useLocalStorage<string>(
		config.localStoragePlayerNameKey,
		localPlayer?.name || "",
	);
	const [joinGameCode, setJoinGameCode] = useState<string>("");

	useEffect(() => {
		if (playerName) {
			logger.info("Setting player name", { data: { playerName } });
			changeName(playerName, api);
		}
	}, [playerName, changeName, api]);

	// Simplified handlers
	const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
		setPlayerName(e.target.value);
	};

	const handleGameCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
		setJoinGameCode(e.target.value);
	};

	const handleJoinClick = () => {
		if (api && playerName && joinGameCode) {
			handleJoinGame(api, joinGameCode);
		}
	};

	const handleCreateClick = () => {
		if (api && playerName) {
			handleCreateGame(api, playerName);
		}
	};

	// Get player count for display
	const playerCount = Array.from(lobbyPlayers).length;
	const gameCount = lobbyState?.games.length || 0;

	return (
		<div className="container mx-auto max-w-4xl p-4">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Player Setup Card */}
				<div className="card bg-base-100 shadow-md border border-base-300">
					<div className="card-body p-4">
						<h2 className="card-title text-lg mb-4">Player Setup</h2>

						<label className="form-control w-full mb-4">
							<div className="label">
								<span className="label-text">Your Name</span>
							</div>
							<div className="input input-bordered flex items-center gap-2">
								<IconUser size="1rem" />
								<input
									id={playerNameInputID}
									type="text"
									className="w-full"
									placeholder="Enter username"
									value={playerName}
									onChange={handleNameChange}
								/>
							</div>
						</label>

						<div className="divider my-2">Join or Create</div>

						<label className="form-control w-full mb-3">
							<div className="label">
								<span className="label-text">Game Code</span>
							</div>
							<div className="flex gap-2">
								<div className="input input-bordered flex items-center gap-2 flex-1">
									<IconId size="1rem" />
									<input
										type="text"
										className="w-full"
										placeholder="Enter code"
										value={joinGameCode}
										onChange={handleGameCodeChange}
									/>
								</div>
								<button
									type="button"
									className="btn btn-secondary"
									onClick={handleJoinClick}
									disabled={!(playerName && joinGameCode)}
								>
									Join
								</button>
							</div>
						</label>

						{/* Create Game Button */}
						<button
							id={createGameButtonID}
							type="button"
							className="btn btn-primary btn-block mt-3"
							onClick={handleCreateClick}
							disabled={!playerName}
						>
							<IconPlus size="1rem" />
							Create New Game
						</button>
					</div>
				</div>

				{/* Players Card */}
				<div className="card bg-base-100 shadow-md border border-base-300">
					<div className="card-body p-4">
						<h2 className="card-title text-lg flex justify-between items-center">
							<span>Players</span>
							<span className="badge badge-sm">{playerCount}</span>
						</h2>

						<div className="divider my-2" />

						<ul className="space-y-2 mt-2">
							{Array.from(lobbyPlayers).map(([id, player]) => (
								<li
									key={id}
									className="flex items-center gap-2 p-2 rounded-sm hover:bg-base-200"
								>
									<div className="avatar avatar-placeholder">
										<div className="bg-neutral text-neutral-content rounded-full w-8">
											<span>{(player.name || "?")[0]?.toUpperCase()}</span>
										</div>
									</div>
									<span>
										{player.name || id.substring(0, 8)}
										{id === localPlayer?.id && (
											<span className="badge badge-primary badge-sm ml-2">
												You
											</span>
										)}
									</span>
								</li>
							))}
							{playerCount === 0 && (
								<li className="text-sm text-center opacity-70 py-4">
									No players in lobby
								</li>
							)}
						</ul>
					</div>
				</div>

				{/* Games Card */}
				<div className="card bg-base-100 shadow-md border border-base-300">
					<div className="card-body p-4">
						<h2 className="card-title text-lg flex justify-between items-center">
							<span>Available Games</span>
							<span className="badge badge-sm">{gameCount}</span>
						</h2>

						<div className="divider my-2" />

						<ul className="space-y-3 mt-2">
							{lobbyState?.games.map((game) => (
								<li
									key={game.id}
									className="bg-base-200 rounded-lg p-3"
								>
									<div className="flex justify-between items-center mb-2">
										<h3 className="font-medium">{game.name || game.id}</h3>
										<span className="text-xs badge badge-sm">
											{game.playerCount}/{game.maxPlayers}
										</span>
									</div>
									<button
										type="button"
										className="btn btn-sm btn-secondary btn-block mt-2"
										onClick={() => api && handleJoinGame(api, game.id)}
										disabled={!playerName}
									>
										<IconArrowRight size="0.9rem" />
										Join Game
									</button>
								</li>
							))}
							{gameCount === 0 && (
								<li className="text-sm text-center opacity-70 py-4">
									No active games. Create one to start playing!
								</li>
							)}
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};
