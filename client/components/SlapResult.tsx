import React from 'react';
import { Alert, Transition } from '@mantine/core';

interface SlapResultProps {
  lastSlapResult: boolean | null;
}

export const SlapResult: React.FC<SlapResultProps> = ({ lastSlapResult }) => {
  if (lastSlapResult === null) return null;

  return (
    <Transition mounted={lastSlapResult !== null} transition="slide-up" duration={400} timingFunction="ease">
      {(styles) => (
        <Alert
          title={lastSlapResult ? 'Valid slap!' : 'Invalid slap!'}
          color={lastSlapResult ? 'green' : 'red'}
          style={{ ...styles, marginTop: '20px' }}
        >
          {lastSlapResult ? 'You successfully slapped the pile!' : 'Oops! That was an invalid slap.'}
        </Alert>
      )}
    </Transition>
  );
};
