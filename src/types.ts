export type RpgSystem =
  | "Dungeons & Dragons (D&D)"
  | "Pathfinder"
  | "Tormenta20 (T20)"
  | "Vampiro: A Máscara (Storyteller)"
  | "Call of Cthulhu"
  | "GURPS"
  | "Savage Worlds"
  | "Fate Core"
  | "Cyberpunk Red"
  | "Old Dragon"
  | "Outro / não especificar";

export type ConfidenceLevel = "Alta" | "Média" | "Baixa";

export interface CardField {
  label: string;
  value: string;
  items: string[];
}

export interface ParsedRpgCard {
  id: string;
  name: string;
  systemEd: string;
  category: string;
  description: string;
  attributes?: string;
  abilities: string[];
  advantages: string[];
  disadvantages: string[];
  buffsDebuffs?: string;
  source: string;
  confidence: ConfidenceLevel;
  extraFields: CardField[];
  rawText: string;
}

export type ParsedBlock =
  | { type: "card"; card: ParsedRpgCard }
  | { type: "prose"; content: string }
  | { type: "table"; content: string };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  activeSystem?: RpgSystem;
  blocks?: ParsedBlock[];
  isError?: boolean;
}

export type DiceType = "d4" | "d6" | "d8" | "d10" | "d12" | "d20" | "d100";

export interface DiceRollResult {
  id: string;
  diceType: DiceType;
  count: number;
  modifier: number;
  mode: "normal" | "advantage" | "disadvantage";
  individualRolls: number[];
  selectedRolls: number[];
  total: number;
  isCrit?: boolean;
  isFumble?: boolean;
  timestamp: number;
}

export type KnowledgeCategory =
  | "Regra da Casa"
  | "Magia / Feitiço"
  | "Item Mágico"
  | "Classe / Subclasse"
  | "Monstro / NPC"
  | "Lore / Cenário"
  | "Mecânica Geral";

export interface KnowledgeEntry {
  id: string;
  title: string;
  system: string; // RpgSystem or "Universal / Todos"
  category: KnowledgeCategory;
  keywords: string[];
  content: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export type UserRole =
  | "Administrador (ADM)"
  | "Mestre da Mesa"
  | "Jogador Explorador"
  | "Criador de Conteúdo"
  | "Guardião do Saber";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  favoriteSystem: RpgSystem;
  createdAt: number;
  isGuest?: boolean;
  isAdmin?: boolean;
}

export const isUserAdmin = (user: UserProfile | null | undefined): boolean => {
  if (!user) return false;
  if (user.isGuest) return false;
  if (user.isAdmin === true) return true;
  if (user.role === "Administrador (ADM)") return true;
  const emailLower = (user.email || "").toLowerCase().trim();
  return (
    emailLower === "adm@mestrearcano.rpg" ||
    emailLower === "admin@mestrearcano.rpg" ||
    emailLower === "admin@arcano.rpg" ||
    emailLower.startsWith("adm@") ||
    emailLower.startsWith("admin@")
  );
};

