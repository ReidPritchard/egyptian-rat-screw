import React, { StrictMode, Suspense, useEffect } from 'react';
import { AppContainer } from './components/AppContainer';
import useApplicationStore, { ApplicationStore, initializeSocketListeners } from './hooks/useApplicationStore';
import './index.css';

export const App: React.FC = () => {
  useEffect(() => {
    initializeSocketListeners();
  }, []);

  const isConnected = useApplicationStore((state: ApplicationStore) => state.isConnected);

  //   'rat-ears-pink': [
  //     '#FFC0CB',
  //     '#FFC0CB',
  //     '#FFC0CB',
  //     '#FFC0CB',
  //     '#FFC0CB',
  //     '#FFC0CB',
  //     '#FFC0CB',
  //     '#FFC0CB',
  //     '#FFC0CB',
  //     '#FFC0CB',
  //     '#FFC0CB',
  //   ],
  //   'rat-blue': [
  //     '#9BC0E1',
  //     '#9BC0E1',
  //     '#9BC0E1',
  //     '#9BC0E1',
  //     '#9BC0E1',
  //     '#9BC0E1',
  //     '#9BC0E1',
  //     '#9BC0E1',
  //     '#9BC0E1',
  //     '#9BC0E1',
  //   ],
  // }

  return (
    <StrictMode>
      <div className="h-screen w-screen p-0 m-0 transition-all duration-150">
        <Suspense fallback={<span className="loading loading-infinity loading-lg"></span>}>
          <AppContainer />
        </Suspense>
      </div>
    </StrictMode>
  );
};
