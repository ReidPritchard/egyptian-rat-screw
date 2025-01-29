import { useCallback, useRef, useEffect } from 'react';

export const useThrottledCallback = (callback: (...args: any[]) => void, delay: number) => {
  // Keep track of the last time the callback was called
  const lastCallTime = useRef<number>(0);
  // Store the latest arguments to be called after delay
  const latestArgs = useRef<any[]>();
  // Store the timeout ID for cleanup
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Clean up any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args: any[]) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime.current;

      // Always store the latest arguments
      latestArgs.current = args;

      // If enough time has passed, execute immediately
      if (timeSinceLastCall >= delay) {
        callback(...args);
        lastCallTime.current = now;
      } else {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Schedule the latest call after the remaining delay
        const remainingDelay = delay - timeSinceLastCall;
        timeoutRef.current = setTimeout(() => {
          if (latestArgs.current) {
            callback(...latestArgs.current);
            lastCallTime.current = Date.now();
            latestArgs.current = undefined;
          }
        }, remainingDelay);
      }
    },
    [callback, delay],
  );
};
