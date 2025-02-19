import type React from "react";
import { StrictMode, Suspense, useEffect } from "react";
import { AppContainer } from "./components/AppContainer";
import { ApiProvider } from "./contexts/ApiContext";
import useApplicationStore from "./store/useApplicationStore";
import "./index.css";

const App: React.FC = () => {
  useEffect(() => {
    useApplicationStore.getState().handleConnection();
  }, []);

  return (
    <ApiProvider>
      <StrictMode>
        <div className="h-screen w-screen p-0 m-0 transition-all duration-150">
          <Suspense
            fallback={<span className="loading loading-infinity loading-lg" />}
          >
            <AppContainer />
          </Suspense>
        </div>
      </StrictMode>
    </ApiProvider>
  );
};

export default App;
