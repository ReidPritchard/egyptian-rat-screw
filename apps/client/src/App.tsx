import type React from "react";
import { StrictMode, Suspense, useEffect } from "react";
import { AppContainer } from "./components/AppContainer";
import useApplicationStore, {
  ApplicationStore,
  initializeSocketListeners,
} from "./hooks/useApplicationStore";
import "./index.css";

export const App: React.FC = () => {
  useEffect(() => {
    initializeSocketListeners();
  }, []);

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
        <Suspense
          fallback={<span className="loading loading-infinity loading-lg" />}
        >
          <AppContainer />
        </Suspense>
      </div>
    </StrictMode>
  );
};
