type ClientErrorEvent = "client.render_failed" | "client.unhandled_error" | "client.unhandled_rejection";

type ClientErrorDetails = {
  event: ClientErrorEvent;
  error?: unknown;
  componentStack?: string;
};

export function reportClientError({ event, error, componentStack = "" }: ClientErrorDetails): string {
  const errorId = crypto.randomUUID();
  const errorName = error instanceof Error ? error.name : typeof error === "string" ? "StringError" : "UnknownError";
  const payload = JSON.stringify({
    event,
    errorId,
    errorName,
    componentStack,
    route: window.location.pathname.slice(0, 240),
  });

  void fetch("/api/client-errors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);

  return errorId;
}

export function installGlobalErrorReporting(): () => void {
  const handleError = (event: ErrorEvent) => {
    reportClientError({ event: "client.unhandled_error", error: event.error });
  };
  const handleRejection = (event: PromiseRejectionEvent) => {
    reportClientError({ event: "client.unhandled_rejection", error: event.reason });
  };
  window.addEventListener("error", handleError);
  window.addEventListener("unhandledrejection", handleRejection);
  return () => {
    window.removeEventListener("error", handleError);
    window.removeEventListener("unhandledrejection", handleRejection);
  };
}
