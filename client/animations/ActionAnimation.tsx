import { IconHandStop } from '@tabler/icons-react';
import { useAnimate } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { PlayingCard } from '../components/PlayingCard';
import { SocketEvents } from '../socketEvents';
import { Card } from '../types';

export const ActionAnimation: React.FC = () => {
  const [scope, animate] = useAnimate();

  const [animation, setAnimation] = useState<string | null>(null);
  const [animationElement, setAnimationElement] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    // Add animation based on the animation state
    switch (animation) {
      case 'card-played':
        animate(scope.current, { opacity: [0, 1, 0] });
        break;
      case 'slap':
        // animate a "slap" animation
        const randomDirection = Math.random() < 0.5 ? 'left' : 'right';
        const keyframes = [
          // the hand should come in from a random direction
          { transform: `translateX(${randomDirection === 'left' ? '-100%' : '100%'})`, scale: 0.5 },
          // stopping above the pile
          { transform: 'translateY(-50%)', scale: 1.2 },
          // and then move down (scale down) "slapping" the pile
          { transform: 'translateY(0%)', scale: 1 },
          // and then disappear
          { opacity: [1, 0] },
        ];
        animate(scope.current, { keyframes, transition: { duration: 1 } });
        break;
    }
  }, [animation]);

  api.on(SocketEvents.CARD_PLAYED, (card: Card) => {
    setAnimation('card-played');
    setAnimationElement(<PlayingCard suit={card.suit} value={card.rank} faceUp={true} />);
  });

  api.on(SocketEvents.SLAP_PILE, () => {
    setAnimation('slap');
    setAnimationElement(<IconHandStop size={100} />);
  });

  return <div ref={scope}>{animationElement}</div>;
};
