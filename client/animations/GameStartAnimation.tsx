import { AspectRatio, Image, Text } from '@mantine/core';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

interface GameStartAnimationProps {
  isVisible: boolean;
  onAnimationComplete: () => void;
}

export const GameStartAnimation: React.FC<GameStartAnimationProps> = ({ isVisible, onAnimationComplete }) => {
  // Timing constants
  const CHAR_REVEAL_INTERVAL = 0; // Time between each character reveal (in ms)
  const MESSAGE_PAUSE = 1000; // Pause time after each message (in ms)
  const FADE_DURATION = 1; // Duration of fade in/out animation (in seconds)
  const SCALE_DURATION = 1; // Duration of scale animation (in seconds)

  // Total duration of the animation:
  // messageLength * CHAR_REVEAL_INTERVAL + MESSAGE_PAUSE * (messageLength - 1) + FADE_DURATION + SCALE_DURATION

  const [messageIndex, setMessageIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');

  const messages = ['Game Starting...', '3', '2', '1', 'GO!'];

  useEffect(() => {
    if (isVisible && messageIndex < messages.length) {
      // Display each character of the current message one by one
      const message = messages[messageIndex];
      let charIndex = 0;
      const intervalId = setInterval(() => {
        if (charIndex <= message.length) {
          setCurrentMessage(message.slice(0, charIndex));
          charIndex++;
        } else {
          clearInterval(intervalId);
          // Move to the next message after a delay
          setTimeout(() => {
            setMessageIndex((prevIndex) => prevIndex + 1);
          }, MESSAGE_PAUSE);
        }
      }, CHAR_REVEAL_INTERVAL);

      return () => clearInterval(intervalId);
    } else if (messageIndex === messages.length) {
      // All messages have been displayed
      onAnimationComplete();
    }
  }, [isVisible, messageIndex]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_DURATION }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#000000',
            zIndex: 9999,
          }}
        >
          {/* Fullscreen image (keep aspect ratio) */}
          <AspectRatio ratio={4 / 3} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 }}>
            <Image
              src={'/assets/hearts.png'}
              width={'100%'}
              height={'100%'}
              // Improve pixel art rendering
              style={{ imageRendering: 'pixelated' }}
            />
          </AspectRatio>
          <motion.div
            key={messageIndex}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: SCALE_DURATION }}
          >
            <Text size="4rem" c="rat-ears-pink" fw={700}>
              {currentMessage}
            </Text>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
