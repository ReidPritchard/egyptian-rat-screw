import React from 'react';
import { Box, Text } from '@mantine/core';

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

export function PlayingCard({ suit, value, faceUp }: CardProps) {
  const suitSymbol = suitSymbols[suit.toLowerCase()];
  const color = suitColors[suit.toLowerCase()];

  return (
    <Box
      w={60}
      h={90}
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
  );
}
