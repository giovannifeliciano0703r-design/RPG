import {
  CharacterSheet,
  DerivedCharacterStats,
  SkillItem,
  CoreStat,
} from "../types";

export const DND5E_DEFAULT_SKILLS: Array<{ name: string; statKey: "str" | "dex" | "con" | "int" | "wis" | "cha" }> = [
  { name: "Acrobacia", statKey: "dex" },
  { name: "Adestrar Animais", statKey: "wis" },
  { name: "Arcanismo", statKey: "int" },
  { name: "Atletismo", statKey: "str" },
  { name: "Atuação", statKey: "cha" },
  { name: "Enganação", statKey: "cha" },
  { name: "Furtividade", statKey: "dex" },
  { name: "História", statKey: "int" },
  { name: "Intimidação", statKey: "cha" },
  { name: "Intuição", statKey: "wis" },
  { name: "Investigação", statKey: "int" },
  { name: "Medicina", statKey: "wis" },
  { name: "Natureza", statKey: "int" },
  { name: "Percepção", statKey: "wis" },
  { name: "Persuasão", statKey: "cha" },
  { name: "Prestidigitação", statKey: "dex" },
  { name: "Religião", statKey: "int" },
  { name: "Sobrevivência", statKey: "wis" },
];

export const calculateStatMod = (stat: CoreStat): number => {
  const total = (stat.base || 10) + (stat.tempBonus || 0);
  return Math.floor((total - 10) / 2);
};

export const calculateProficiencyBonus = (level: number, override?: number): number => {
  if (typeof override === "number" && override > 0) return override;
  const safeLevel = Math.max(1, Math.min(30, level || 1));
  return Math.floor((safeLevel - 1) / 4) + 2;
};

export const calculateDerivedStats = (sheet: CharacterSheet): DerivedCharacterStats => {
  const strMod = calculateStatMod(sheet.strength);
  const dexMod = calculateStatMod(sheet.dexterity);
  const conMod = calculateStatMod(sheet.constitution);
  const intMod = calculateStatMod(sheet.intelligence);
  const wisMod = calculateStatMod(sheet.wisdom);
  const chaMod = calculateStatMod(sheet.charisma);

  const profBonus = calculateProficiencyBonus(sheet.level, sheet.proficiencyBonusOverride);

  // Sum up temp condition bonuses
  let conditionAcBonus = 0;
  let conditionSaveBonus = 0;
  let conditionHpMaxBonus = 0;

  (sheet.activeConditions || []).forEach((c) => {
    if (c.acBonus) conditionAcBonus += c.acBonus;
    if (c.saveBonus) conditionSaveBonus += c.saveBonus;
    if (c.hpMaxBonus) conditionHpMaxBonus += c.hpMaxBonus;
  });

  // Calculate Armor Class (AC)
  let totalAC = 10 + dexMod;
  if (typeof sheet.armorClassOverride === "number" && sheet.armorClassOverride > 0) {
    totalAC = sheet.armorClassOverride;
  } else if (sheet.equippedArmorBonus) {
    // E.g. Plate (18) or Chain Shirt (13 + max 2 dex)
    totalAC = sheet.equippedArmorBonus + (sheet.equippedShieldBonus || 0);
  } else {
    totalAC = 10 + dexMod + (sheet.equippedShieldBonus || 0);
  }
  totalAC += conditionAcBonus;

  // Calculate Max HP
  let totalMaxHp = 0;
  if (typeof sheet.maxHpOverride === "number" && sheet.maxHpOverride > 0) {
    totalMaxHp = sheet.maxHpOverride;
  } else {
    const hitDieMax = sheet.hitDiceType === "d6" ? 6 : sheet.hitDiceType === "d8" ? 8 : sheet.hitDiceType === "d10" ? 10 : 12;
    const avgPerLevel = Math.floor(hitDieMax / 2) + 1;
    // Level 1 max die + remaining levels avg
    const baseHp = hitDieMax + (Math.max(1, sheet.level) - 1) * avgPerLevel;
    totalMaxHp = Math.max(1, baseHp + Math.max(1, sheet.level) * conMod);
  }
  totalMaxHp += conditionHpMaxBonus;

  // Initiative
  const initiative = dexMod + (sheet.initiativeBonus || 0);

  // Saving Throws
  const savingThrows: Record<string, number> = {
    strength: strMod + (sheet.savingThrowProficiencies?.strength ? profBonus : 0) + conditionSaveBonus,
    dexterity: dexMod + (sheet.savingThrowProficiencies?.dexterity ? profBonus : 0) + conditionSaveBonus,
    constitution: conMod + (sheet.savingThrowProficiencies?.constitution ? profBonus : 0) + conditionSaveBonus,
    intelligence: intMod + (sheet.savingThrowProficiencies?.intelligence ? profBonus : 0) + conditionSaveBonus,
    wisdom: wisMod + (sheet.savingThrowProficiencies?.wisdom ? profBonus : 0) + conditionSaveBonus,
    charisma: chaMod + (sheet.savingThrowProficiencies?.charisma ? profBonus : 0) + conditionSaveBonus,
  };

  // Skill Modifiers
  const skillModifiers: Record<string, number> = {};
  (sheet.skills || []).forEach((sk) => {
    let baseMod = 0;
    switch (sk.statKey) {
      case "str": baseMod = strMod; break;
      case "dex": baseMod = dexMod; break;
      case "con": baseMod = conMod; break;
      case "int": baseMod = intMod; break;
      case "wis": baseMod = wisMod; break;
      case "cha": baseMod = chaMod; break;
      default: baseMod = 0;
    }

    let mod = baseMod;
    if (sk.proficient) mod += profBonus;
    if (sk.expertise) mod += profBonus; // Double prof bonus for expertise
    if (typeof sk.bonusOverride === "number") mod += sk.bonusOverride;

    skillModifiers[sk.id || sk.name] = mod;
  });

  // Passive Perception
  const perceptionSkill = (sheet.skills || []).find((s) => s.name.toLowerCase().includes("percepção"));
  const perceptionMod = perceptionSkill ? (skillModifiers[perceptionSkill.id || perceptionSkill.name] ?? wisMod) : wisMod;
  const passivePerception = 10 + perceptionMod;

  // Spellcasting DC & Attack
  let castingMod = 0;
  if (sheet.spellcastingAbility === "int") castingMod = intMod;
  else if (sheet.spellcastingAbility === "wis") castingMod = wisMod;
  else if (sheet.spellcastingAbility === "cha") castingMod = chaMod;

  const spellSaveDC = 8 + profBonus + castingMod;
  const spellAttackBonus = profBonus + castingMod;

  return {
    strMod,
    dexMod,
    conMod,
    intMod,
    wisMod,
    chaMod,
    proficiencyBonus: profBonus,
    totalMaxHp,
    totalAC,
    initiative,
    passivePerception,
    spellSaveDC,
    spellAttackBonus,
    savingThrows,
    skillModifiers,
  };
};

export const createDefaultCharacterSheet = (
  ownerId: string,
  ownerName: string,
  overrides?: Partial<CharacterSheet>
): CharacterSheet => {
  const now = Date.now();
  const defaultSkills: SkillItem[] = DND5E_DEFAULT_SKILLS.map((sk, idx) => ({
    id: `sk-${idx}-${sk.name.toLowerCase().replace(/\s+/g, "_")}`,
    name: sk.name,
    statKey: sk.statKey,
    proficient: false,
    expertise: false,
  }));

  return {
    id: `char-${now}-${Math.random().toString(36).substring(2, 7)}`,
    ownerId,
    ownerName,
    name: "Valerius, o Bravo",
    system: "D&D 5e",
    race: "Humano",
    characterClass: "Guerreiro",
    subclass: "Campeão",
    level: 3,
    xp: 900,
    avatarUrl: "",
    alignment: "Neutro e Bom",
    background: "Soldado",

    strength: { base: 16, tempBonus: 0 },
    dexterity: { base: 14, tempBonus: 0 },
    constitution: { base: 15, tempBonus: 0 },
    intelligence: { base: 10, tempBonus: 0 },
    wisdom: { base: 12, tempBonus: 0 },
    charisma: { base: 8, tempBonus: 0 },

    currentHp: 28,
    tempHp: 0,
    hitDiceTotal: 3,
    hitDiceCurrent: 3,
    hitDiceType: "d10",
    speed: 9,
    initiativeBonus: 0,
    equippedArmorBonus: 16, // Cota de Malha
    equippedShieldBonus: 2, // Escudo

    savingThrowProficiencies: {
      strength: true,
      dexterity: false,
      constitution: true,
      intelligence: false,
      wisdom: false,
      charisma: false,
    },

    skills: defaultSkills,
    activeConditions: [],

    spellSlots: {
      1: { total: 0, used: 0 },
      2: { total: 0, used: 0 },
      3: { total: 0, used: 0 },
    },
    spells: [],

    inventory: [
      {
        id: "inv-1",
        name: "Espada Longa Arcaica",
        quantity: 1,
        weight: 1.5,
        equipped: true,
        category: "Arma",
        damageOrAC: "1d8+3 Cortante (1d10 Versátil)",
        description: "Forjada em aço temperado com runas gravadas na guarda.",
      },
      {
        id: "inv-2",
        name: "Cota de Malha Pesada",
        quantity: 1,
        weight: 25,
        equipped: true,
        category: "Armadura",
        damageOrAC: "CA 16",
        description: "Armadura de anéis entrelaçados.",
      },
      {
        id: "inv-3",
        name: "Poção de Cura Menor",
        quantity: 3,
        weight: 0.5,
        equipped: false,
        category: "Poção",
        damageOrAC: "Cura 2d4+2 PV",
        description: "Líquido vermelho brilhante que cheira a canela.",
      },
    ],
    currency: { cp: 25, sp: 14, ep: 0, gp: 65, pp: 0 },

    personalityTraits: "Sempre fico de guarda e confio na honra dos meus companheiros.",
    ideals: "Proteção: Meu dever é defender aqueles que não podem empunhar uma espada.",
    bonds: "Minha ordem de cavaleiros foi dispersada, mas busco honrar seu legado.",
    flaws: "Hesito em recuar mesmo quando as probabilidades são terríveis.",
    featuresAndTraits: "• Retomar o Fôlego (1d10 + Nível de Guerreiro como Ação Bônus 1x por descanso curto).\n• Estilo de Luta: Defesa (+1 na CA quando usando armadura).\n• Surto de Ação (1 Ação adicional no turno 1x por descanso curto).",
    notes: "",

    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};
