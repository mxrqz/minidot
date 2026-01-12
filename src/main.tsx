import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/globals.css";
import { setupWindowBehavior } from "./lib/windowBehavior";

// Initialize app features
async function initializeApp(): Promise<void> {
  // Setup window blur-to-hide behavior (menu bar popup style)
  await setupWindowBehavior();
}

initializeApp();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
