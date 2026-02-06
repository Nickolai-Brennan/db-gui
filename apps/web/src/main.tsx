import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./index.css";
import ErdPage from "./pages/ErdPage";

const qc = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/workspaces/:wsId/instances/:instanceId/erd" element={<ErdPage />} />
          <Route
            path="*"
            element={<Navigate to="/workspaces/default/instances/demo/erd" replace />}
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
