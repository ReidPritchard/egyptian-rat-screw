import type React from "react";
import { useApplicationStore } from "../store/useApplicationStore";
import { Game } from "./Game";
import { Lobby } from "./Lobby";
import { NavBar } from "./NavBar";

import { useEffect, useState } from "react";
import { newLogger } from "../logger";
import { PlayerSettingsModal } from "./PlayerSettingsModal";

const logger = newLogger("AppContainer");

export const AppContainer: React.FC = () => {
	const userLocation = useApplicationStore((state) => state.userLocation);
	const [isPlayerSettingsModalOpen, setIsPlayerSettingsModalOpen] =
		useState(false);

	useEffect(() => {
		logger.debug(`userLocation: ${userLocation}`);
	}, [userLocation]);

	function handlePlayerSettingsModalOpen() {
		logger.debug("Settings nav item clicked");
		setIsPlayerSettingsModalOpen(true);
	}

	return (
		<>
			<div className="flex flex-col h-screen w-screen bg-base-300 gap-8">
				<NavBar onPlayerSettingsModalOpen={handlePlayerSettingsModalOpen} />

				<div className="flex-grow">
					{userLocation === "lobby" ? <Lobby /> : <Game />}
				</div>
			</div>
			<PlayerSettingsModal
				isOpen={isPlayerSettingsModalOpen}
				onClose={() => setIsPlayerSettingsModalOpen(false)}
			/>
		</>
	);
};
