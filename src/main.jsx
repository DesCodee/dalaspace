import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import DalaSpaceApp from "./DalaSpaceApp";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DalaSpaceApp />
  </StrictMode>
);
