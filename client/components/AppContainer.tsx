import { ActionIcon, AspectRatio, Flex, Image, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import React from 'react';
import { useApplicationContext } from '../hooks/ApplicationState';
import { Game } from './Game';
import { Lobby } from './Lobby';

export const AppContainer: React.FC = () => {
  const { userLocation } = useApplicationContext();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const logo = './assets/rat.png';
  const title = './assets/title.png';

  return (
    <Flex direction="column" style={{ height: '100vh', width: '100vw' }}>
      <Flex direction="row" align="flex-end" justify="center" p="lg">
        <AspectRatio ratio={4 / 3} w="30%">
          <Image src={logo} style={{ imageRendering: 'pixelated' }} />
        </AspectRatio>
        <AspectRatio ratio={10 / 2} w="70%">
          <Image src={title} style={{ imageRendering: 'pixelated' }} />
        </AspectRatio>
      </Flex>

      <Flex style={{ flexGrow: 1 }}>{userLocation === 'lobby' ? <Lobby /> : <Game />}</Flex>

      <ActionIcon
        variant="outline"
        color={colorScheme === 'dark' ? 'yellow' : 'blue'}
        onClick={() => toggleColorScheme()}
        title="Toggle color scheme"
        style={{ position: 'absolute', bottom: 0, right: 0, margin: '1rem' }}
      >
        {colorScheme === 'dark' ? <IconSun stroke={1.5} /> : <IconMoon stroke={1.5} />}
      </ActionIcon>
    </Flex>
  );
};
