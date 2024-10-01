import { Box, Flex, Text } from '@mantine/core';
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
      <Flex direction="column" align="center" style={{ height: '100%' }}>
        <Text ta="center" size="sm" mb="xs">
          Waiting for players to be ready...
        </Text>
        {gameState.playerIds.map((playerId) => (
          <Text ta="center" size="sm" mb="xs" key={playerId}>
            {gameState.playerNames[playerId]}: {gameState.playerReadyStatus[playerId] ? 'Ready' : 'Not Ready'}
          </Text>
        ))}
      </Flex>
    );
  };

  const renderGameBoard = () => {
    return (
      <Flex style={{ height: '100%' }}>
        <Flex direction="column" justify="center" style={{ flex: 2, padding: '1rem' }}>
          <Text ta="center" size="sm" mb="xs">
            Pile Size: {gameState?.pileCards?.length ?? 0}
          </Text>
          <Flex justify="center" align="center" style={{ flex: 1 }}>
            {gameState.pileCards.length > 0 && (
              <BottomCard
                bottomCard={gameState.pileCards[0]}
                duration={config.game.bottomCardDisplayDuration}
                key={gameState.pileCards[0].id}
              />
            )}
            <CardStack ref={cardStackRef} pile={gameState.pileCards} />
          </Flex>
        </Flex>
        <Box style={{ flex: 1, padding: '1rem' }}>
          <TurnOrder gameState={gameState} localPlayerId={localPlayer.id} />
        </Box>
      </Flex>
    );
  };

  return (
    <Box style={{ height: '100%', width: '100%' }}>
      {gameState.stage === GameStage.PRE_GAME ? renderPreGameReady() : renderGameBoard()}
    </Box>
  );
};
