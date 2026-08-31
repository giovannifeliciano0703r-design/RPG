export const RPG_SYSTEMS = [
  "Dungeons & Dragons (D&D)",
  "Pathfinder",
  "Tormenta20 (T20)",
  "Vampiro: A Máscara (Storyteller)",
  "Call of Cthulhu",
  "GURPS",
  "Savage Worlds",
  "Fate Core",
  "Cyberpunk Red",
  "Old Dragon",
  "Outro / não especificar",
] as const;

export type RpgSystem = (typeof RPG_SYSTEMS)[number];

export const DEFAULT_RPG_SYSTEM: RpgSystem = "Dungeons & Dragons (D&D)";

const LEGACY_SYSTEM_ALIASES: Record<string, RpgSystem> = {
  "D&D 5e": "Dungeons & Dragons (D&D)",
  "D&D 5ª Edição": "Dungeons & Dragons (D&D)",
  Tormenta20: "Tormenta20 (T20)",
  "Pathfinder 2e": "Pathfinder",
  "Genérico": "Outro / não especificar",
};

const NORMALIZED_SYSTEMS = new Map<string, RpgSystem>([
  ...RPG_SYSTEMS.map((system) => [system.trim().toLocaleLowerCase("pt-BR"), system] as const),
  ...Object.entries(LEGACY_SYSTEM_ALIASES).map(([alias, system]) => [alias.trim().toLocaleLowerCase("pt-BR"), system] as const),
]);

export function isRpgSystem(value: unknown): value is RpgSystem {
  return typeof value === "string" && (RPG_SYSTEMS as readonly string[]).includes(value);
}

export function normalizeRpgSystem(value: unknown): RpgSystem {
  if (isRpgSystem(value)) return value;
  if (typeof value === "string") return NORMALIZED_SYSTEMS.get(value.trim().toLocaleLowerCase("pt-BR")) ?? DEFAULT_RPG_SYSTEM;
  return DEFAULT_RPG_SYSTEM;
}
