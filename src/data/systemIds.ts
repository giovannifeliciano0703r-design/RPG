export const RPG_SYSTEM_IDS = {
  DND5E: "D&D 5e",
  TORMENTA20: "Tormenta20",
  PATHFINDER2E: "Pathfinder",
  GENERIC: "Genérico",
} as const;

export type CharacterSystemId = (typeof RPG_SYSTEM_IDS)[keyof typeof RPG_SYSTEM_IDS];

export const CHARACTER_TO_RPG_SYSTEM: Record<CharacterSystemId, string> = {
  [RPG_SYSTEM_IDS.DND5E]: "Dungeons & Dragons (D&D)",
  [RPG_SYSTEM_IDS.TORMENTA20]: "Tormenta20 (T20)",
  [RPG_SYSTEM_IDS.PATHFINDER2E]: "Pathfinder",
  [RPG_SYSTEM_IDS.GENERIC]: "Outro / não especificar",
};

export function matchesActiveSystem(characterSystem: CharacterSystemId, activeSystem: string): boolean {
  return CHARACTER_TO_RPG_SYSTEM[characterSystem] === activeSystem;
}
