import type React from "react";
import { useApplicationStore } from "../store/useApplicationStore";
import { Game } from "./Game";
import { Lobby } from "./Lobby";
import { NavBar } from "./NavBar";

import { useEffect } from "react";
import { newLogger } from "../logger";

const logger = newLogger("AppContainer");

export const AppContainer: React.FC = () => {
  const userLocation = useApplicationStore((state) => state.userLocation);

  useEffect(() => {
    logger.debug(`userLocation: ${userLocation}`);
  }, [userLocation]);

  return (
    <div className="flex flex-col h-screen w-screen bg-base-300 gap-8">
      <NavBar />

      <div className="flex-grow">
        {userLocation === "lobby" ? <Lobby /> : <Game />}
      </div>
    </div>
  );
};
