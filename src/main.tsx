import React from "react";
import ReactDOM from "react-dom/client";
import "./App.tokens.css"; // Tokens de animação mandatórios
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
