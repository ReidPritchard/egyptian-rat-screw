import React from 'react';
import { Alert, Transition } from '@mantine/core';

interface ErrorMessagesProps {
  errorMessages: string[];
  dismissError: (index: number) => void;
}

export const ErrorMessages: React.FC<ErrorMessagesProps> = ({ errorMessages, dismissError }) => {
  if (errorMessages.length === 0) return null;

  return (
    <Transition mounted={errorMessages.length > 0} transition="fade" duration={400} timingFunction="ease">
      {(styles) => (
        <Alert
          title="Error"
          color="red"
          onClose={() => dismissError(0)}
          style={{ ...styles, marginBottom: '20px' }}
        >
          {errorMessages[0]}
        </Alert>
      )}
    </Transition>
  );
};