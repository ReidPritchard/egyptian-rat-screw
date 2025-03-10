import { isGameStatusInCategory } from "@/utils/categories";
import type { GameSettings, SlapRule } from "@oer/shared/types";
import {
  IconHandStop,
  IconPlayCard,
  IconRobot,
  IconSettings,
} from "@tabler/icons-react";
import type React from "react";
import { useState } from "react";
import { useApi } from "../contexts/ApiContext";
import { useHotkeys } from "../hooks/useHotkeys";
import { useLocalPlayerSettings } from "../hooks/useLocalPlayerSettings";
import { useApplicationStore } from "../store/useApplicationStore";
import { useGameStore } from "../store/useGameStore";
import { SettingsDrawer } from "./SettingsDrawer";

export const PlayerActions: React.FC = () => {
  const { localPlayer } = useApplicationStore();
  const { isLocalPlayerTurn, gameState } = useGameStore();
  const { settings: localPlayerSettings } = useLocalPlayerSettings();
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
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
        <div
          className="tooltip tooltip-neutral tooltip-left"
          data-tip="Game Settings"
        >
          <button
            type="button"
            className="btn btn-outline btn-md"
            onClick={() => {
              setIsSettingsDrawerOpen(true);
            }}
          >
            <IconSettings size="1.5rem" />
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

  const renderAddBotAction = () => {
    if (
      gameState?.status &&
      isGameStatusInCategory(gameState?.status, "PRE_GAME")
    ) {
      return (
        <div className="tooltip tooltip-primary" data-tip="Add a bot">
          <button
            type="button"
            className="btn btn-outline btn-lg"
            onClick={() => api?.addBot()}
          >
            <IconRobot size="1.5rem" />
          </button>
        </div>
      );
    }
  };

  return (
    <>
      <div id="player-actions" className="navbar bg-base-100">
        <div className="navbar-start flex-1" />
        <div className="navbar-center gap-2">
          {renderPlayCardAction()}
          {renderSlapPileAction()}
          {renderAddBotAction()}
        </div>
        <div className="navbar-end flex-1">{renderGameSettingsAction()}</div>
      </div>
      <SettingsDrawer
        isOpen={isSettingsDrawerOpen}
        onClose={() => setIsSettingsDrawerOpen(false)}
        gameSettings={gameState?.settings as GameSettings}
        allSlapRules={gameState?.settings.slapRules as SlapRule[]}
        localPlayerSettings={localPlayerSettings}
        handleGameSettingsChange={() => {}}
        handleLocalPlayerSettingsChange={() => {}}
      />
    </>
  );
};
