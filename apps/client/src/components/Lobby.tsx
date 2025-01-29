import { IconArrowRight, IconId, IconPlus, IconUser } from '@tabler/icons-react';
import { ChangeNamePayload } from 'client/socketEvents';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { config } from '../config';
import { useApplicationStore } from '../hooks/useApplicationStore';
import { useLobbyStore } from '../hooks/useLobbyStore';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useThrottledCallback } from '../hooks/useThrottledCallback';
import { useLocalPlayerSettings } from '../hooks/useLocalPlayerSettings';

export const Lobby: React.FC = () => {
  const { changeName } = useLocalPlayerSettings();
  const { lobbyState, lobbyPlayers, handleJoinGame, handleCreateGame } = useLobbyStore();
  const { localPlayer } = useApplicationStore();

  const [playerName, setPlayerName] = useLocalStorage(config.localStoragePlayerNameKey, localPlayer?.name || '');
  const [joinGameCode, setJoinGameCode] = useState('');

  useEffect(() => {
    const handleConnect = () => {
      if (playerName) {
        changeName(playerName);
      }
    };

    api.socket.on('connect', handleConnect);

    return () => {
      api.socket.off('connect', handleConnect);
    };
  }, [playerName]);

  // throttle name change
  const throttledChangeName = useThrottledCallback((payload: ChangeNamePayload) => api.changeName(payload), 1000);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setPlayerName(newName);
    changeName(newName);
    if (api.socket.connected) {
      throttledChangeName({ name: newName });
    }
  };

  const handleJoinGameCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGameCode = e.target.value;
    setJoinGameCode(newGameCode);
  };

  return (
    <section className="flex flex-col md:flex-row items-start justify-around h-full w-full">
      <div className="flex flex-col items-stretch justify-between gap-4">
        <label className="input input-bordered flex items-center gap-2">
          <IconUser size="1.1rem" />
          <input type="text" className="grow" placeholder="Username" value={playerName} onChange={handleNameChange} />
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
          <button className="btn btn-primary join-item" onClick={handleCreateGame} disabled={!playerName}>
            <IconPlus size="1.1rem" />
            Create Game
          </button>
          <button
            className="btn btn-secondary join-item"
            onClick={() => handleJoinGame(joinGameCode)}
            disabled={!playerName || !joinGameCode}
          >
            <IconArrowRight size="1.1rem" />
            Join Game
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <section className="p-4 pt-0">
          <h3 className="text-2xl font-bold border-b-2 border-secondary pb-2">Players ({lobbyPlayers.length})</h3>
          <br />
          <div className="flex flex-col items-start">
            <AnimatePresence>
              {lobbyPlayers.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="flex flex-row items-center justify-center gap-3">
                    {player.name}
                    {player.id === localPlayer?.id && <span className="badge badge-primary">You</span>}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <section className="p-4 pt-0">
          <h3 className="text-2xl font-bold border-b-2 border-secondary pb-2">Games</h3>
          <br />
          <div className="flex flex-col items-center">
            <AnimatePresence>
              {lobbyState?.games.map((game) => (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="card bg-base-100 w-28 shadow-xl">
                    <section className="card-body">
                      <h2 className="card-title">{game.name}</h2>
                      <p className="text-xs p-3">
                        Players: {game.playerCount}/{game.maxPlayers}
                      </p>
                      <div className="card-actions justify-end">
                        <button className="btn btn-primary" onClick={() => handleJoinGame(game.id)}>
                          <IconArrowRight size="1.1rem" />
                          Join
                        </button>
                      </div>
                    </section>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </motion.div>
    </section>
  );
};
