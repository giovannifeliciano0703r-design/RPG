import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { RelatorioView } from "./components/RelatorioView.tsx";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { migrateLocalStorageSchema } from "./constants/storageKeys";
import { migrateStoredUsers } from "./utils/securityMigration";
import "./index.css";

migrateLocalStorageSchema();
migrateStoredUsers();

function RootRouter() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (pathname === "/relatorio" || pathname.startsWith("/relatorio")) return <RelatorioView />;
  return <App />;
}

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root não encontrado.");

createRoot(root).render(
  <StrictMode>
    <AppErrorBoundary><RootRouter /></AppErrorBoundary>
  </StrictMode>
);
