import { isGameStatusInCategory } from "@/utils/categories";
import {
  IconHandStop,
  IconPlayCard,
  IconPlayerPlay,
  IconSettings,
} from "@tabler/icons-react";
import type React from "react";
import { useApi } from "../contexts/ApiContext";
import { useHotkeys } from "../hooks/useHotkeys";
import { useLocalPlayerSettings } from "../hooks/useLocalPlayerSettings";
import { useApplicationStore } from "../store/useApplicationStore";
import { useGameStore } from "../store/useGameStore";

export const PlayerActions: React.FC = () => {
  const { localPlayer } = useApplicationStore();
  const { isLocalPlayerTurn, gameState, playerReady } = useGameStore();
  const { settings: localPlayerSettings } = useLocalPlayerSettings();
  const api = useApi();
  const gameOver =
    gameState?.status && isGameStatusInCategory(gameState?.status, "POST_GAME");

  useHotkeys(
    [
      [
        localPlayerSettings.hotkeys.slap,
        () => {
          if (!gameOver && localPlayer) {
            api?.slapPile({
              playerId: localPlayer.id,
            });
          }
        },
      ],
      [
        localPlayerSettings.hotkeys.playCard,
        () => {
          if (!gameOver && isLocalPlayerTurn) {
            api?.playCard({});
          }
        },
      ],
    ],
    ["INPUT", "TEXTAREA"]
  );

  const renderGameSettingsAction = () => {
    if (
      gameState?.status &&
      isGameStatusInCategory(gameState?.status, "PRE_GAME")
    ) {
      return (
        <div className="tooltip tooltip-primary" data-tip="Game settings (g)">
          <button
            type="button"
            className="btn btn-outline btn-lg"
            onClick={() => console.log("Game settings")}
          >
            <IconSettings size="1.5rem" />
          </button>
        </div>
      );
    }
  };

  const renderStartGameAction = () => {
    if (
      gameState?.status &&
      isGameStatusInCategory(gameState?.status, "PRE_GAME") &&
      localPlayer
    ) {
      return (
        <div className="tooltip tooltip-primary" data-tip="Ready up">
          <button
            type="button"
            className="btn btn-lg btn-success"
            onClick={() => api && playerReady(api)}
          >
            <IconPlayerPlay size="1.5rem" />
          </button>
        </div>
      );
    }
  };

  const renderPlayCardAction = () => {
    if (
      gameState?.status &&
      isGameStatusInCategory(gameState?.status, "IN_GAME")
    ) {
      return (
        <div className="tooltip tooltip-primary" data-tip="Play a card (n)">
          <button
            type="button"
            className="btn btn-outline btn-lg"
            onClick={() => api?.playCard({})}
            disabled={!isLocalPlayerTurn}
          >
            <IconPlayCard size="1.5rem" />
          </button>
        </div>
      );
    }
  };

  const renderSlapPileAction = () => {
    if (
      gameState?.status &&
      isGameStatusInCategory(gameState?.status, "IN_GAME")
    ) {
      return (
        <div
          className="tooltip tooltip-primary"
          data-tip="Slap the pile if you think it's a valid slap (space)"
        >
          <button
            type="button"
            className="btn btn-outline btn-lg"
            onClick={() => api?.slapPile({ playerId: localPlayer?.id })}
          >
            <IconHandStop size="1.5rem" />
          </button>
        </div>
      );
    }
  };

  return (
    <div id="player-actions" className="navbar bg-base-100">
      <div className="navbar-start flex-1" />
      <div className="navbar-center gap-2">
        {renderGameSettingsAction()}
        {renderStartGameAction()}
        {renderPlayCardAction()}
        {renderSlapPileAction()}
      </div>
      <div className="navbar-end flex-1" />
    </div>
  );
};
