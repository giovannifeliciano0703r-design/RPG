import type { RpgSystem } from "./domain/rpgSystems";

export type { RpgSystem } from "./domain/rpgSystems";

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

export type ChatChannel = "IC" | "OOC" | "in_character" | "ooc";
export type ChatChannelType = "IC" | "OOC";

export interface ChatMessage {
  id: string;
  role?: "user" | "assistant";
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  characterId?: string;
  channel?: ChatChannel;
  content: string;
  timestamp: number;
  activeSystem?: RpgSystem;
  blocks?: ParsedBlock[];
  isError?: boolean;
  type?: "TEXT" | "ROLL" | "IMAGE" | "SYSTEM";
  rollData?: {
    formula: string;
    total: number;
    rolls?: number[];
    individualRolls?: number[];
    isCrit?: boolean;
    isFumble?: boolean;
  };
  imageUrl?: string;
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
  system: string;
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
  authorization?: {
    source: "server";
    permissions: readonly ["knowledge:manage"];
  };
}

export const isUserAdmin = (user: UserProfile | null | undefined): boolean => {
  return Boolean(
    user &&
      !user.isGuest &&
      user.authorization?.source === "server" &&
      user.authorization.permissions.includes("knowledge:manage"),
  );
};

// ==========================================
// 1. SMART CHARACTER SHEET TYPES
// ==========================================
export interface CoreStat {
  base: number;
  tempBonus: number;
  overrideFormula?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  statKey: string; // e.g. "dex", "wis"
  proficient: boolean;
  expertise?: boolean;
  bonusOverride?: number;
}

export interface TempConditionEffect {
  id: string;
  name: string; // e.g., "Abençoado", "Escudo Arcano", "Fúria", "Envenenado"
  description?: string;
  acBonus?: number;
  attackBonus?: number;
  damageBonus?: string; // e.g. "+2" or "+1d4"
  saveBonus?: number;
  hpMaxBonus?: number;
  speedBonus?: number;
  disadvantageOnAttacks?: boolean;
  advantageOnAttacks?: boolean;
  roundsRemaining?: number;
}

export interface SpellItem {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  prepared: boolean;
  damageOrHealing?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  equipped: boolean;
  category: "Arma" | "Armadura" | "Item Mágico" | "Poção" | "Geral";
  damageOrAC?: string;
  description?: string;
}

export interface FeatureItem {
  id: string;
  name: string;
  description: string;
  usageFrequency?: string; // e.g. "1X POR TURNO", "1X POR DESCANSO CURTO", "PASSIVA"
  damage?: string; // e.g. "1D6", "2D8+3"
  tags?: string[]; // e.g. ["ÁGIL", "LEVE"]
}

export interface DiverseItem {
  id: string;
  name: string;
  price?: string; // e.g. "25G", "1C"
  weight?: string; // e.g. "0.5KG"
  tags?: string[]; // e.g. ["ÁGIL", "LEVE"]
  damage?: string;
  description?: string;
  equipped?: boolean;
}

export interface CharacterSheet {
  id: string;
  campaignId?: string;
  ownerId: string;
  ownerName: string;
  name: string;
  system: RpgSystem;
  race: string;
  characterClass: string;
  subclass?: string;
  level: number;
  xp?: number;
  avatarUrl: string;
  tokenUrl?: string;
  alignment?: string;
  background?: string;

  // New fields from Reference Images
  multiclass?: string;
  multiclassLevel?: number;
  origin?: string; // e.g. "Montanhas do céu"
  age?: string; // e.g. "17"
  sizeCategory?: string; // e.g. "2,05"
  inspiration?: boolean | number;
  passivePerceptionBonus?: number;
  languages?: string; // "Língua tribal(Nortista)\nLíngua imperial (comum)"
  armorAndWeaponTraining?: string; // "Treinamento em Armas e Armaduras"
  toolsAndInstruments?: string; // "Ferramentas, Instrumentos e Conjuntos de Jogos"

  // Base Stats
  strength: CoreStat;
  dexterity: CoreStat;
  constitution: CoreStat;
  intelligence: CoreStat;
  wisdom: CoreStat;
  charisma: CoreStat;

  // HP & Defenses
  maxHpOverride?: number;
  currentHp: number;
  tempHp: number;
  hitDiceTotal: number;
  hitDiceCurrent: number;
  hitDiceType: "d6" | "d8" | "d10" | "d12";
  armorClassOverride?: number;
  equippedArmorBonus?: number;
  equippedShieldBonus?: number;
  speed: number;
  initiativeBonus: number;
  proficiencyBonusOverride?: number;

  // Death saves
  deathSaves?: {
    successes: number; // 0 to 3
    failures: number; // 0 to 3
  };

  // Custom Formula configuration
  customFormulas?: Record<string, string>;

  // Saving Throws Proficiency
  savingThrowProficiencies: {
    strength: boolean;
    dexterity: boolean;
    constitution: boolean;
    intelligence: boolean;
    wisdom: boolean;
    charisma: boolean;
  };

  // Skills
  skills: SkillItem[];

  // Buffs / Conditions
  activeConditions: TempConditionEffect[];

  // Spells, Slots & Magic Attributes
  spellcastingAbility?: "int" | "wis" | "cha";
  spellcastingBonus?: number;
  spellSaveModifier?: number;
  otherResourcesCount?: number; // e.g. Fúria, Canalizar Divindade [ - 0 + ]
  preparedSpellsCount?: number; // [ - 0 + ]
  cantripSlots?: number; // [ - 0 + ]
  spellSlots: Record<number, { total: number; used: number }>;
  spells: SpellItem[];

  // Features and Abilities (Habilidades de Classe / Raça)
  featuresList?: FeatureItem[];

  // Inventory, Items & Equipment Slots
  inventory: InventoryItem[];
  diverseItems?: DiverseItem[];
  equippedSlots?: {
    leftHand?: string;
    rightHand?: string;
    armor?: string;
    accessories?: string;
  };
  currency: { cp: number; sp: number; ep: number; gp: number; pp: number };

  // Notes & Bio
  notesStructure?: {
    missions?: string;
    alliances?: string;
    reminders?: string;
    otherNotes?: string;
  };
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  featuresAndTraits?: string;
  notes?: string;

  updatedAt: number;
  createdAt: number;
}

// Derived computed stats for UI
export interface DerivedCharacterStats {
  strMod: number;
  dexMod: number;
  conMod: number;
  intMod: number;
  wisMod: number;
  chaMod: number;
  proficiencyBonus: number;
  totalMaxHp: number;
  totalAC: number;
  initiative: number;
  passivePerception: number;
  spellSaveDC: number;
  spellAttackBonus: number;
  savingThrows: Record<string, number>;
  skillModifiers: Record<string, number>;
}

// ==========================================
// 2. MONSTER STATBLOCK TYPES
// ==========================================
export interface MonsterAction {
  name: string;
  description: string;
  attackBonus?: number;
  damageDice?: string; // e.g. "2d6 + 3"
  damageType?: string; // e.g. "Cortante", "Fogo"
  reachOrRange?: string; // e.g. "1.5m" or "24/96m"
}

export interface MonsterStatBlock {
  id: string;
  name: string;
  system: string;
  size: "Miúdo" | "Pequeno" | "Médio" | "Grande" | "Enorme" | "Descomunal";
  creatureType: string; // e.g. "Humanoide", "Morto-vivo", "Dragão", "Monstruosidade", "Aberração"
  alignment: string;
  armorClass: number;
  armorType?: string;
  hp: {
    average: number;
    formula: string; // e.g. "12d10 + 48"
  };
  speed: string; // e.g. "9m, voo 18m"

  stats: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };

  savingThrows?: string;
  skills?: string;
  damageVulnerabilities?: string;
  damageResistances?: string;
  damageImmunities?: string;
  conditionImmunities?: string;
  senses: string;
  languages: string;
  challengeRating: string; // e.g. "1/4", "5", "17"
  xp: number;

  traits: Array<{ name: string; description: string }>;
  actions: MonsterAction[];
  bonusActions?: MonsterAction[];
  reactions?: MonsterAction[];
  legendaryActions?: {
    countPerRound: number;
    actions: MonsterAction[];
  };

  imageUrl?: string;
  tokenUrl?: string;
  isCustom?: boolean;
  notes?: string;
  provenance?: "open-reference" | "original-homebrew" | "user-created";
  sourceAttribution?: string;
}

// ==========================================
// 3. MACRO SYSTEM TYPES
// ==========================================
export type MacroCategory = "Ataques" | "Magias" | "Perícias" | "Itens" | "Utilidades";

export interface Macro {
  id: string;
  name: string;
  command: string; // e.g. "/roll 1d20 + @{strMod} + @{profBonus} [Ataque Espada Longa]"
  category: MacroCategory;
  characterId?: string; // If null/empty -> Account macro or Shared GM macro
  creatorId: string;
  creatorName: string;
  isShared: boolean; // If true and created by GM -> available to all campaign players
  icon?: string;
  color?: string;
  description?: string;
  createdAt: number;
}

export interface ParsedMacroExecution {
  rawCommand: string;
  resolvedCommand: string;
  title: string;
  diceRolls: Array<{
    formula: string;
    total: number;
    individualRolls: number[];
    isCrit?: boolean;
    isFumble?: boolean;
  }>;
  finalTotal: number;
  outputMessage: string;
}

// ==========================================
// 4 & 5. MEDIA LIBRARY & COMPRESSION TYPES
// ==========================================
export type MediaAlbumType = "Tokens" | "Retratos" | "Mapas & Cenários" | "Handouts" | "Geral";

export interface MediaAsset {
  id: string;
  userId: string;
  name: string;
  album: MediaAlbumType;
  originalUrl: string; // Runtime blob URL, HTTPS URL, or a data URL awaiting persistence
  thumbnailUrl: string; // Runtime thumbnail URL; binary data is persisted in IndexedDB
  fileSizeBytes: number;
  dimensions: { width: number; height: number };
  mimeType: string;
  tags: string[];
  createdAt: number;
}

// ==========================================
// 6. NPC FOLDER TYPES
// ==========================================
export interface NpcFolder {
  id: string;
  campaignId?: string;
  name: string;
  parentId?: string; // For nested subfolders
  color: string;
  icon?: string;
  description?: string;
}

export interface NpcEntry {
  id: string;
  folderId?: string;
  name: string;
  titleOrRole: string; // e.g. "Líder da Guarda de Neverwinter"
  faction?: string;
  location?: string;
  attitude: "Amigável" | "Neutro" | "Hostil" | "Desconhecido";
  avatarUrl?: string;
  tokenUrl?: string;
  quickStats?: {
    hp: number;
    ac: number;
    cr?: string;
    keyAttacks?: string;
  };
  personality: string;
  appearance: string;
  secretsGmOnly: string;
  tags: string[];
  linkedMonsterId?: string;
  linkedSheetId?: string;
  createdAt: number;
  updatedAt: number;
}

// ==========================================
// 7. LOCAL CAMPAIGNS & DUAL CHAT
// ==========================================
export type CampaignRole = "GM" | "CO_GM" | "PLAYER" | "SPECTATOR";

export interface CoGmPermissions {
  canEditMaps: boolean;
  canManageNpcs: boolean;
  canManageMonsters: boolean;
  canInvitePlayers: boolean;
  canManageInitiative: boolean;
  canKickPlayers: boolean;
  canEditSharedMacros: boolean;
}

export interface CampaignMember {
  userId: string;
  userName: string;
  userAvatar: string;
  role: CampaignRole;
  coGmPermissions?: CoGmPermissions;
  activeCharacterId?: string; // Selected character for In-Character Chat
  assignedCharacterIds: string[];
  joinedAt: number;
}

export interface Campaign {
  id: string;
  remoteId?: string;
  inviteCode: string;
  name: string;
  description: string;
  bannerUrl?: string;
  system: RpgSystem;
  gmUserId: string;
  gmUserName: string;
  members: CampaignMember[];
  maxCharactersPerPlayer: number;
  allowPlayerPvp: boolean;
  isPrivate: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CampaignChatMessage {
  id: string;
  campaignId: string;
  channel: ChatChannel;
  senderUserId: string;
  senderName: string; // Character name if IC, Account nick if OOC
  senderAvatar: string;
  characterId?: string;
  content: string;
  isMacroRoll?: boolean;
  macroName?: string;
  rollDetails?: {
    formula: string;
    total: number;
    diceResults: number[];
    isCrit?: boolean;
    isFumble?: boolean;
    label?: string;
  };
  attachmentUrl?: string;
  timestamp: number;
}

// ==========================================
// 8. INTERACTIVE VTT BATTLEMAP & TOKENS
// ==========================================
export interface VttTokenCondition {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface VttToken {
  id: string;
  name: string;
  imageUrl: string;
  x: number; // in grid cells or px
  y: number;
  size: number; // 1 = 1x1 cell, 2 = 2x2 cell (Large), 3 = 3x3 (Huge)
  currentHp: number;
  maxHp: number;
  tempHp?: number;
  ac?: number;
  elevation: number; // in meters/feet
  rotation: number; // in degrees
  conditions: string[]; // List of condition names
  visibleToPlayers: boolean;
  sheetId?: string;
  monsterId?: string;
  ownerUserId?: string; // If player-owned
  colorRing?: string;
}

export interface VttMapPreset {
  id: string;
  title: string;
  category: "Masmorra" | "Floresta" | "Taverna" | "Cripta" | "Cidade" | "Ermos";
  description: string;
  imageUrl: string;
  defaultGridSize: number;
}

export interface VttMap {
  id: string;
  campaignId?: string;
  title: string;
  imageUrl: string;
  gridConfig: {
    enabled: boolean;
    cellSize: number; // in px, e.g. 50-80
    color: string;
    opacity: number;
    type: "square" | "hex";
  };
  tokens: VttToken[];
  fogOfWar: {
    enabled: boolean;
    revealedCells: Record<string, boolean>; // key "x,y"
  };
  gmNotes: Array<{
    id: string;
    x: number;
    y: number;
    title: string;
    content: string;
    color: string;
  }>;
  rulerMeasurement?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    distanceFeet: number;
  };
  isActive?: boolean;
}

export interface MapToken {
  id: string;
  characterId?: string;
  ownerId?: string;
  name: string;
  avatarUrl?: string;
  x: number;
  y: number;
  size: number;
  currentHp: number;
  maxHp: number;
  tempHp?: number;
  ac: number;
  isEnemy: boolean;
  isVisibleToPlayers?: boolean;
  isLocked?: boolean;
  conditions: string[];
  speed?: number;
}

export interface FogOfWarPolygon {
  id: string;
  points: { x: number; y: number }[];
  isRevealed: boolean;
}

export interface MeasurementLine {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  distanceInMeters: number;
}

export interface BattleMapData {
  id: string;
  campaignId?: string;
  title: string;
  imageUrl: string;
  gridSize: number;
  gridColor: string;
  width: number;
  height: number;
  fogRevealed: boolean;
  fogPolygons: FogOfWarPolygon[];
  tokens: MapToken[];
}

export interface InitiativeCombatant {
  id: string;
  name: string;
  avatarUrl?: string;
  initiativeRoll: number;
  currentHp: number;
  maxHp: number;
  ac: number;
  isEnemy: boolean;
}

export interface InitiativeState {
  round: number;
  currentTurnIndex: number;
  combatants: InitiativeCombatant[];
}

