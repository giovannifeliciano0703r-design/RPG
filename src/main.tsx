import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { migrateLocalStorageSchema } from "./constants/storageKeys";
import { migrateStoredUsers } from "./utils/securityMigration";
import "./index.css";

migrateLocalStorageSchema();
migrateStoredUsers();

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root não encontrado.");

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary><App /></AppErrorBoundary>
  </StrictMode>,
);
