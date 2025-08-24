import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./components/AppRouter.jsx";
import "./index.css";
import {
  ConnectivityAlert,
  ConnectivityProvider,
} from "./contexts/ConnectivityContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ConnectivityProvider>
      <ConnectivityAlert />
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </ConnectivityProvider>
  </React.StrictMode>
);
