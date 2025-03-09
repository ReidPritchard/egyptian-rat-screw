import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const appContainer = document.getElementById("app");
if (!appContainer) {
  console.error("No app container found");
  throw new Error("No app container found");
}
const root = createRoot(appContainer);
root.render(<App />);
