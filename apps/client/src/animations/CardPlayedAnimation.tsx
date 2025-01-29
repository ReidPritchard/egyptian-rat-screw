import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';
import { PlayingCard } from '../components/PlayingCard';
import { config } from '../config';
import { newLogger } from '../logger';
import { Card } from '../types';

const logger = newLogger('CardPlayedAnimation');

interface CardPlayedAnimationProps {
  isVisible: boolean;
  card: Card | null;
  onAnimationComplete: () => void;
  targetRef: React.RefObject<HTMLDivElement>; // Reference to the CardStack component
}

export const CardPlayedAnimation: React.FC<CardPlayedAnimationProps> = ({
  isVisible,
  card,
  onAnimationComplete,
  targetRef,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [endPosition, setEndPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isVisible && card) {
      // Pick a random direction outside the screen to start the animation
      //   const randomX = Math.random() < 0.5 ? -100 : 100;
      //   const randomY = Math.random() < 0.5 ? -100 : 100;
      //   setStartPosition({ x: randomX, y: randomY });
      setStartPosition({ x: 0, y: 0 });

      setEndPosition(calculateEndPosition(targetRef));

      setTimeout(() => {
        onAnimationComplete();
        logger.info('Card played animation complete');
      }, config.animation.cardPlayedAnimationDuration * 1000);

      logger.info('Starting card played animation', card);
    }
  }, [isVisible, card?.code]);

  const calculateEndPosition = (targetRef: React.RefObject<HTMLDivElement>) => {
    if (!cardRef.current || !targetRef.current) return { x: 0, y: 0 };

    const cardRect = cardRef.current.getBoundingClientRect();
    const targetRect = targetRef.current.getBoundingClientRect();

    // Calculate the cneter of the card
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;

    logger.info('Card center', cardCenterX, cardCenterY);

    // Calculate the center of the target
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    logger.info('Target center', targetCenterX, targetCenterY);

    // Calculate the offset
    const offsetX = targetCenterX - cardCenterX;
    const offsetY = targetCenterY - cardCenterY;

    logger.info('Offset', offsetX, offsetY);

    return { x: offsetX, y: offsetY };
  };

  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      {isVisible && card && (
        <motion.div
          key={`${card.code}`}
          initial={{ opacity: 0, scale: 0.5, x: startPosition.x, y: startPosition.y }}
          animate={{ opacity: 1, scale: 1, ...endPosition }}
          exit={{ opacity: 0, scale: 0.5, x: endPosition.x, y: endPosition.y }}
          transition={{
            duration: config.animation.cardPlayedAnimationDuration,
            opacity: { duration: config.animation.cardPlayedAnimationDuration / 2 },
          }}
          style={{
            position: 'fixed',
            zIndex: 9999,
            transformOrigin: 'top left',
          }}
        >
          <PlayingCard ref={cardRef} key={card.id} suit={card.suit} value={card.rank} faceUp={true} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
