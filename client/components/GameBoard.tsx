import { Box, Grid, Group, Text } from '@mantine/core';
import React from 'react';
import { config } from '../config';
import { useApplicationContext } from '../hooks/ApplicationState';
import { GameStage } from '../types';
import { BottomCard } from './BottomCard';
import { CardStack } from './CardStack';
import { TurnOrder } from './TurnOrder';

export const GameBoard: React.FC = () => {
  const { gameState, localPlayer, cardStackRef } = useApplicationContext();

  if (!gameState || !localPlayer) {
    console.error('GameBoard: gameState or localPlayer is null');
    return null;
  }

  const renderPreGameReady = () => {
    return (
      <Grid justify="center" align="flex-start" h="100%">
        <Grid.Col span={8}>
          <Text ta="center" size="sm" mb="xs">
            Waiting for players to be ready...
          </Text>

          {/* Render the ready status of each player */}
          {gameState.playerIds.map((playerId) => (
            <Text ta="center" size="sm" mb="xs" key={playerId}>
              {gameState.playerNames[playerId]}: {gameState.playerReadyStatus[playerId] ? 'Ready' : 'Not Ready'}
            </Text>
          ))}
        </Grid.Col>
      </Grid>
    );
  };

  const renderGameBoard = () => {
    return (
      <Grid justify="center" align="flex-start" h="100%">
        <Grid.Col span={8}>
          <Box my="md">
            <Text ta="center" size="sm" mb="xs">
              Pile Size: {gameState?.pileCards?.length ?? 0}
            </Text>
            <Group justify="center" mb="xl">
              {gameState.pileCards.length > 0 && (
                <BottomCard
                  bottomCard={gameState.pileCards[0]}
                  duration={config.game.bottomCardDisplayDuration}
                  key={gameState.pileCards[0].id}
                />
              )}
              <CardStack ref={cardStackRef} pile={gameState.pileCards} />
            </Group>
          </Box>
        </Grid.Col>
        <Grid.Col span={4}>
          <TurnOrder gameState={gameState} localPlayerId={localPlayer.id} />
        </Grid.Col>
      </Grid>
    );
  };

  return gameState.stage === GameStage.PRE_GAME ? renderPreGameReady() : renderGameBoard();
};
