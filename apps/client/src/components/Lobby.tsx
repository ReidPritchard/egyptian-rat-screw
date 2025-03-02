import {
  IconArrowRight,
  IconId,
  IconPlus,
  IconUser,
} from "@tabler/icons-react";
import type React from "react";
import { useEffect, useState } from "react";
import { config } from "../config";
import { useApi } from "../contexts/ApiContext";
import { useLocalPlayerSettings } from "../hooks/useLocalPlayerSettings";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { newLogger } from "../logger";
import { useApplicationStore } from "../store/useApplicationStore";
import { useLobbyStore } from "../store/useLobbyStore";

const logger = newLogger("Lobby");

export const Lobby: React.FC = () => {
  const { changeName } = useLocalPlayerSettings();
  const { lobbyState, lobbyPlayers, handleJoinGame, handleCreateGame } =
    useLobbyStore();
  const { localPlayer } = useApplicationStore();
  const api = useApi();

  const [playerName, setPlayerName] = useLocalStorage<string>(
    config.localStoragePlayerNameKey,
    localPlayer?.name || ""
  );
  const [joinGameCode, setJoinGameCode] = useState<string>("");

  useEffect(() => {
    if (playerName) {
      logger.info("Setting player name", { data: { playerName } });
      changeName(playerName, api);
    }
  }, [playerName, changeName, api]);

  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setPlayerName(newName);
  };

  const handleJoinGameCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJoinGameCode(e.target.value);
  };

  const getPlayerDisplayName = (player: { id: string; name?: string }) => {
    return (
      player.name ||
      player.id.replace("-", " ").replace(/\b\w/g, (char) => char.toUpperCase())
    );
  };

  return (
    <section className="flex flex-col md:flex-row items-start justify-around h-full w-full">
      <div className="animate-fadeInScale flex flex-col items-stretch justify-between gap-4">
        <label className="input input-bordered flex items-center gap-2">
          <IconUser size="1.1rem" />
          <input
            type="text"
            className="grow"
            placeholder="Username"
            value={playerName}
            onChange={handleNameInputChange}
          />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <IconId size="1.1rem" />
          <input
            type="text"
            className="grow"
            placeholder="Join Game Code"
            value={joinGameCode}
            onChange={handleJoinGameCodeChange}
          />
        </label>

        <div className="join">
          <button
            type="button"
            className="btn btn-primary join-item"
            onClick={() => api && handleCreateGame(api, playerName)}
            disabled={!playerName}
          >
            <IconPlus size="1.1rem" />
            Create Game
          </button>
          <button
            type="button"
            className="btn btn-secondary join-item"
            onClick={() => api && handleJoinGame(api, joinGameCode)}
            disabled={!(playerName && joinGameCode)}
          >
            <IconArrowRight size="1.1rem" />
            Join Game
          </button>
        </div>
      </div>

      <div className="animate-fadeInUp">
        <section className="p-4 pt-0">
          <h3 className="text-2xl font-bold border-b-2 border-secondary pb-2">
            Players ({Array.from(lobbyPlayers).length})
          </h3>
          <div className="flex flex-col items-start mt-4 gap-2">
            {Array.from(lobbyPlayers).map((player) => (
              <div key={player.id} className="animate-fadeInLeft">
                <p className="flex items-center gap-3">
                  {getPlayerDisplayName(player)}
                  {player.id === localPlayer?.id && (
                    <span className="badge badge-primary">You</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="animate-fadeInUp">
        <section className="p-4 pt-0">
          <h3 className="text-2xl font-bold border-b-2 border-secondary pb-2">
            Games
          </h3>
          <div className="flex flex-col items-center mt-4 gap-4">
            {lobbyState?.games.map((game) => (
              <div key={game.id} className="animate-fadeInScale">
                <div className="card bg-base-100 w-28 shadow-xl">
                  <div className="card-body p-3">
                    <h2 className="card-title text-center">{game.name}</h2>
                    <p className="text-xs text-center">
                      Players: {game.playerCount}/{game.maxPlayers}
                    </p>
                    <div className="card-actions justify-center mt-2">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => api && handleJoinGame(api, game.id)}
                      >
                        <IconArrowRight size="1.1rem" />
                        Join
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};
