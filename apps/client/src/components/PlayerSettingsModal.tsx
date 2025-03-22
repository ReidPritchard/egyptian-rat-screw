import { Hotkeys } from "@/clientTypes";
import { useLocalPlayerSettings } from "@/hooks/useLocalPlayerSettings";
import type React from "react";
import { useState } from "react";

interface PlayerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerSettingsModal: React.FC<PlayerSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const localPlayerSettings = useLocalPlayerSettings();

  const [hotkeys, setHotkeys] = useState<Hotkeys>(
    localPlayerSettings.getHotkeys()
  );

  const [enableHotkeys, setEnableHotkeys] = useState(hotkeys.enable);

  const handleClose = () => {
    // Save settings
    localPlayerSettings.saveHotkeys(hotkeys);

    onClose();
  };

  if (!isOpen) return null;
  return (
    <div className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <h1 className="text-2xl font-bold">Player Settings</h1>

        <h2 className="text-lg font-bold">Hotkeys</h2>

        <div className="form-control">
          <label className="label cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={enableHotkeys}
              className="toggle"
            />
            <span className="label-text">Enable hotkeys</span>
          </label>
        </div>

        {enableHotkeys && (
          <div className="form-control">
            <label className="label cursor-pointer">
              <span className="label-text">
                Play Card
                <p className="kbd">{hotkeys.playCard}</p>
              </span>
              <input type="text" className="input input-bordered" />
            </label>
          </div>
        )}

        <div className="modal-action">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn" onClick={handleClose}>
              Close
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
