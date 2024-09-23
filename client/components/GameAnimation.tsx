import React, { useEffect, useState } from 'react';
import { GameState, PlayerAction, PlayerActionResult, PlayerActionType } from '../types';
import { motion } from 'framer-motion';
import { Overlay } from '@mantine/core';

interface GameAnimationProps {
  action: PlayerActionType;
  duration: number;
}

export const GameAnimation: React.FC<GameAnimationProps> = ({ action, duration }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  let asset = '';
  switch (action) {
    case 'slap':
      asset = 'hand.svg';
      break;
  }

  let animation = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  // Animate the asset performing the action using framer motion
  return (
    <>
      {isVisible && (
        <Overlay>
          <motion.img src={asset} alt="action" {...animation} />
        </Overlay>
      )}
    </>
  );
};
