import { AspectRatio, Container, Flex, Image } from '@mantine/core';
import React from 'react';
import { useApplicationContext } from '../hooks/ApplicationState';
import { Game } from './Game';
import { Lobby } from './Lobby';

export const AppContainer: React.FC = () => {
  const { userLocation } = useApplicationContext();

  const logo = './assets/rat.png';
  const title = './assets/title.png';

  const renderHeader = () => {
    return (
      <Flex direction={'row'} align={'flex-end'} justify={'center'} p="lg">
        <AspectRatio ratio={4 / 3} w="30%">
          <Image
            src={logo}
            // Improve pixel art rendering
            style={{ imageRendering: 'pixelated' }}
          />
        </AspectRatio>
        <AspectRatio ratio={10 / 2} w="70%">
          <Image
            src={title}
            // Improve pixel art rendering
            style={{ imageRendering: 'pixelated' }}
          />
        </AspectRatio>
      </Flex>
    );
  };

  const renderContent = () => {
    return userLocation === 'lobby' ? <Lobby /> : <Game />;
  };

  return (
    <Container>
      {renderHeader()}
      {renderContent()}
    </Container>
  );
};
