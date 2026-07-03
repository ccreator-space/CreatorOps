import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AppSettingsProvider } from "./features/settings/AppSettingsProvider";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppSettingsProvider>
      <App />
    </AppSettingsProvider>
  </React.StrictMode>
);
