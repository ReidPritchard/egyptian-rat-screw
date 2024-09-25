import React from 'react';
import { Alert, Transition, Badge } from '@mantine/core';
import { IconCheck, IconX } from '@tabler/icons-react';

interface SlapResultProps {
  lastSlapResult: boolean | null;
}

export const SlapResult: React.FC<SlapResultProps> = ({ lastSlapResult }) => {
  if (lastSlapResult === null) return null;

  return (
    <Transition mounted={lastSlapResult !== null} transition="slide-up" duration={400} timingFunction="ease">
      {(styles) => (
        <Alert
          icon={lastSlapResult ? <IconCheck size={20} color="green" /> : <IconX size={20} color="red" />}
          title={lastSlapResult ? 'Valid slap!' : 'Invalid slap!'}
          color={lastSlapResult ? 'green' : 'red'}
          style={{ ...styles, marginTop: '20px' }}
        >
          {lastSlapResult ? 'You successfully slapped the pile!' : 'Oops! That was an invalid slap.'}
          <Badge color={lastSlapResult ? 'green' : 'red'} variant="filled">
            {lastSlapResult ? 'Success' : 'Failure'}
          </Badge>
        </Alert>
      )}
    </Transition>
  );
};
