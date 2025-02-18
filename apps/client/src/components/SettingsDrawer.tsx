import {
  Button,
  Drawer,
  MultiSelect,
  NumberInput,
  Stack,
  Text,
} from "@mantine/core";
import type React from "react";
import { useState } from "react";
import type { LocalPlayerSettings } from "../clientTypes";
import type { GameSettings, SlapRule } from "../types";

interface SettingsDrawerProps {
  gameSettings: GameSettings;
  allSlapRules: SlapRule[];
  localPlayerSettings: LocalPlayerSettings;
  handleGameSettingsChange: (settings: GameSettings) => void;
  handleLocalPlayerSettingsChange: (settings: LocalPlayerSettings) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  gameSettings,
  allSlapRules,
  handleGameSettingsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Drawer
      opened={isOpen}
      onClose={() => setIsOpen(false)}
      title="Game Settings"
      padding="xl"
      size="sm"
    >
      <Stack>
        <NumberInput
          label="Max Players"
          value={gameSettings.maximumPlayers}
          onChange={(value) =>
            handleGameSettingsChange({
              ...gameSettings,
              maximumPlayers: Number(value),
            })
          }
          min={2}
          max={8}
        />
        <MultiSelect
          label="Slap Rules"
          data={allSlapRules.map((rule) => ({
            value: rule.name,
            label: rule.name,
          }))}
          value={gameSettings.slapRules.map((rule) => rule.name)}
          onChange={(selectedRules) =>
            handleGameSettingsChange({
              ...gameSettings,
              slapRules: selectedRules.map((rule) => {
                const foundRule = allSlapRules.find((r) => r.name === rule);
                if (!foundRule) {
                  throw new Error(`Rule not found: ${rule}`);
                }
                return foundRule;
              }),
            })
          }
          placeholder="Select slap rules"
        />
        <Button onClick={() => setIsOpen(false)}>Save</Button>
      </Stack>
      <Stack>
        <Text>Local Player Settings</Text>
        {/* 
          TODO: Implement local player settings
          mostly to allow for changing Hotkeys
        */}
        {/* <Switch
          label="Enable Hotkeys"
          checked={localPlayerSettings.hotkeys === null}
          onChange={(event) =>
            handleLocalPlayerSettingsChange({
              ...localPlayerSettings,
              hotkeys: event.currentTarget.checked ? null : { playCard: '', slap: '' },
            })
          }
        /> */}
      </Stack>
    </Drawer>
  );
};
