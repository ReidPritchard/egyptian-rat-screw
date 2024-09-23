import React, { useState } from 'react';
import { Drawer, Stack, NumberInput, MultiSelect, Button, Switch, Text } from '@mantine/core';
import { GameSettings, SlapRule, LocalPlayerSettings } from '../types';

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
  localPlayerSettings,
  handleGameSettingsChange,
  handleLocalPlayerSettingsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Drawer opened={isOpen} onClose={() => setIsOpen(false)} title="Game Settings" padding="xl" size="sm">
      <Stack>
        <NumberInput
          label="Max Players"
          value={gameSettings.maximumPlayers}
          onChange={(value) => handleGameSettingsChange({ ...gameSettings, maximumPlayers: Number(value) })}
          min={2}
          max={8}
        />
        <MultiSelect
          label="Slap Rules"
          data={allSlapRules.map((rule) => ({ value: rule.name, label: rule.name }))}
          value={gameSettings.slapRules.map((rule) => rule.name)}
          onChange={(selectedRules) =>
            handleGameSettingsChange({
              ...gameSettings,
              slapRules: selectedRules.map((rule) => allSlapRules.find((r) => r.name === rule)!),
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
