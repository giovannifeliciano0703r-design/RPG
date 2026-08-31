const SUPPORTED_MODELS = new Set([
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
]);

const DEFAULT_MODELS = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash-lite"] as const;

export function getCandidateModels(configured?: string): string[] {
  if (!configured) return [...DEFAULT_MODELS];
  const selected = [...new Set(configured.split(",").map((value) => value.trim()).filter((value) => SUPPORTED_MODELS.has(value)))];
  return selected.length ? selected.slice(0, 5) : [...DEFAULT_MODELS];
}
