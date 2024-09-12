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
            sx={(theme) => ({
                width: '60px',
                height: '90px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '5px',
                backgroundColor: faceUp ? 'white' : theme.colors.gray[3],
                color: faceUp ? color : theme.colors.gray[3],
                userSelect: 'none',
            })}
        >
            {faceUp ? (
                <>
                    <Text size="sm" weight="bold" align="left">
                        {value}
                    </Text>
                    <Text size="xl" align="center">
                        {suitSymbol}
                    </Text>
                    <Text size="sm" weight="bold" align="left" sx={{ transform: 'rotate(180deg)' }}>
                        {value}
                    </Text>
                </>
            ) : (
                <Text size="xl" align="center" color="gray.3">
                    ?
                </Text>
            )}
        </Box>
    );
}