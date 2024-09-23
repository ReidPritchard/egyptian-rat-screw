import React from 'react';
import { Paper, Group, Title, Button, Collapse, Stack, Text } from '@mantine/core';
import { GameState, PlayerAction, PlayerActionResult, PlayerActionType } from '../types';

interface ActionLogProps {
  playerActionLog: (PlayerAction | PlayerActionResult)[];
  isActionLogExpanded: boolean;
  toggleActionLog: () => void;
  gameState: GameState;
}

export const ActionLog: React.FC<ActionLogProps> = ({
  playerActionLog,
  isActionLogExpanded,
  toggleActionLog,
  gameState,
}) => {
  const getPlayerName = (playerId: string): string => {
    return gameState.playerNames[playerId];
  };

  const getActionMessage = (action: PlayerAction | PlayerActionResult): { message: string; color: string } => {
    let message = '';
    let color = 'blue';
    const playerName = getPlayerName(action.playerId);
    switch (action.actionType) {
      case PlayerActionType.PLAY_CARD:
        message = `${playerName} played a card`;
        break;
      case PlayerActionType.SLAP:
        message = `${playerName} made a valid slap`;
        color = 'green';
        break;
      case PlayerActionType.INVALID_SLAP:
        message = `${playerName} made an invalid slap`;
        color = 'red';
        break;
      case PlayerActionType.CHALLENGE_COUNTER_COMPLETE:
        message = `${playerName} completed a challenge counter`;
        color = 'green';
        break;
      case PlayerActionType.FACE_CARD_CHALLENGE:
        message = `${playerName} started a face card challenge`;
        color = 'green';
        break;
      default:
        console.log('Unknown action type', action);
        message = `${playerName} performed an action`;
    }
    return { message, color };
  };

  return (
    <Paper withBorder p="xs" mt="md">
      <Group>
        <Title order={6}>Actions</Title>
        <Button variant="subtle" onClick={toggleActionLog}>
          {isActionLogExpanded ? 'Hide' : 'Show'}
        </Button>
      </Group>
      <Collapse in={isActionLogExpanded}>
        <Stack>
          {playerActionLog.slice(0, 10).map((action, index) => {
            const { message, color } = getActionMessage(action);
            return (
              <Group key={index}>
                {'timestamp' in action ? (
                  <Text c="dimmed" size="xs">
                    {new Date(action.timestamp).toLocaleTimeString()}
                  </Text>
                ) : null}
                <Text c={color} size="sm">
                  {message}
                </Text>
              </Group>
            );
          })}
        </Stack>
      </Collapse>
    </Paper>
  );
};
