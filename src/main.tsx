import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { NavigationProvider } from "./navigation";
import { ToastProvider } from "./components/primitives";
import { App } from "./App";
import "./styles.css";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <NavigationProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </NavigationProvider>
    </HashRouter>
  </React.StrictMode>,
);
