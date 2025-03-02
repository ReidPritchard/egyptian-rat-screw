import type React from "react";
import { StrictMode, Suspense, useEffect } from "react";
import { AppContainer } from "./components/AppContainer";
import { ApiProvider } from "./contexts/ApiContext";
import { useLocalPlayerSettings } from "./hooks/useLocalPlayerSettings";
import useApplicationStore from "./store/useApplicationStore";
import "./index.css";

const App: React.FC = () => {
  // Initialize app connection
  useEffect(() => {
    useApplicationStore.getState().handleConnection();
  }, []);

  // Initialize theme from settings
  useEffect(() => {
    const savedSettings = useLocalPlayerSettings.getState().settings;
    if (savedSettings.ui.theme) {
      document.documentElement.setAttribute(
        "data-theme",
        savedSettings.ui.theme
      );
    }
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
