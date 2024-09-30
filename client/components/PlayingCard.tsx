import { AspectRatio, Box, Text } from '@mantine/core';
import React, { forwardRef } from 'react';

interface CardProps {
  suit: string;
  value: string;
  faceUp: boolean;
}

const suitSymbols: { [key: string]: string } = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors: { [key: string]: string } = {
  hearts: 'red',
  diamonds: 'red',
  clubs: 'black',
  spades: 'black',
};

export const PlayingCard = forwardRef<HTMLDivElement, CardProps>(({ suit, value, faceUp }, ref) => {
  const suitSymbol = suitSymbols[suit.toLowerCase()];
  const color = suitColors[suit.toLowerCase()];

  // Keep the card aspect ratio, but let it grow to fill the space
  const aspectRatio = 60 / 90;

  return (
    <AspectRatio ratio={aspectRatio} style={{ width: '100%', height: '100%' }}>
      <Box
        ref={ref}
        style={{
          border: '1px solid #ccc',
          borderRadius: '5px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '5px',
          backgroundColor: faceUp ? 'white' : 'gray.3',
          color: faceUp ? color : 'gray.3',
          userSelect: 'none',
          width: '100%',
          height: '100%',
        }}
      >
        {faceUp ? (
          <>
            <Text fz="sm" fw="bold" ta="left">
              {value}
            </Text>
            <Text fz="xl" ta="center">
              {suitSymbol}
            </Text>
            <Text fz="sm" fw="bold" ta="left" style={{ transform: 'rotate(180deg)' }}>
              {value}
            </Text>
          </>
        ) : (
          <Text fz="xl" ta="center" c="gray.3">
            ?
          </Text>
        )}
      </Box>
    </AspectRatio>
  );
});
