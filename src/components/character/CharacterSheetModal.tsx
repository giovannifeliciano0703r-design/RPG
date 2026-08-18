import React, { useState, useEffect } from "react";
import {
  X,
  Shield,
  Heart,
  Zap,
  Sparkles,
  Swords,
  BookOpen,
  Backpack,
  User,
  Plus,
  Trash2,
  Dice5,
  Dices,
  Flame,
  AlertCircle,
  Copy,
  Download,
  Upload,
  Search,
  Check,
  Star,
  Compass,
  Footprints,
  Flag,
  RotateCcw,
  Users,
  Coins,
  ChevronUp,
  Save,
  Crosshair,
  TrendingUp,
} from "lucide-react";
import {
  CharacterSheet,
  SkillItem,
  SpellItem,
  InventoryItem,
  DiverseItem,
  FeatureItem,
  CoreStat,
} from "../../types";
import { calculateDerivedStats, calculateStatMod } from "../../utils/characterCalculations";

interface CharacterSheetModalProps {
  isOpen: boolean;
  sheet: CharacterSheet;
  characters?: CharacterSheet[];
  onSelectCharacter?: (char: CharacterSheet) => void;
  onClose: () => void;
  onSave: (updated: CharacterSheet) => void;
  onRollCheck?: (label: string, bonus: number) => void;
}

const ALL_DND_SKILLS: Array<{ id: string; name: string; statKey: "dex" | "str" | "int" | "wis" | "cha" }> = [
  { id: "acrobacia", name: "ACROBACIA", statKey: "dex" },
  { id: "arcanismo", name: "ARCANISMO", statKey: "int" },
  { id: "atletismo", name: "ATLETISMO", statKey: "str" },
  { id: "enganacao", name: "ENGANAÇÃO", statKey: "cha" },
  { id: "furtividade", name: "FURTIVIDADE", statKey: "dex" },
  { id: "historia", name: "HISTÓRIA", statKey: "int" },
  { id: "intimidacao", name: "INTIMIDAÇÃO", statKey: "cha" },
  { id: "intuicao", name: "INTUIÇÃO", statKey: "wis" },
  { id: "investigacao", name: "INVESTIGAÇÃO", statKey: "int" },
  { id: "manejo_animais", name: "MANEJO DE ANIMAIS", statKey: "wis" },
  { id: "medicina", name: "MEDICINA", statKey: "wis" },
  { id: "performance", name: "PERFORMANCE", statKey: "cha" },
  { id: "natureza", name: "NATUREZA", statKey: "int" },
  { id: "percepcao", name: "PERCEPÇÃO", statKey: "wis" },
  { id: "religiao", name: "RELIGIÃO", statKey: "int" },
  { id: "persuasao", name: "PERSUASÃO", statKey: "cha" },
  { id: "sobrevivencia", name: "SOBREVIVÊNCIA", statKey: "wis" },
  { id: "prestidigitacao", name: "PRESTIDIGITAÇÃO", statKey: "dex" },
];

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({
  isOpen,
  sheet,
  characters = [],
  onSelectCharacter,
  onClose,
  onSave,
  onRollCheck,
}) => {
  const [data, setData] = useState<CharacterSheet>({ ...sheet });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCharList, setShowCharList] = useState(false);

  // Search & filter states
  const [inventorySearch, setInventorySearch] = useState("");
  const [diverseSearch, setDiverseSearch] = useState("");
  const [featuresSearch, setFeaturesSearch] = useState("");
  const [spellsSearch, setSpellsSearch] = useState("");

  // Modal new item popups
  const [newEquipName, setNewEquipName] = useState("");
  const [newEquipPrice, setNewEquipPrice] = useState("25G");
  const [newEquipDamage, setNewEquipDamage] = useState("1D6");
  const [newEquipWeight, setNewEquipWeight] = useState("0.5KG");
  const [newEquipTags, setNewEquipTags] = useState("ÁGIL, LEVE");
  const [showAddEquip, setShowAddEquip] = useState(false);

  const [newDiverseName, setNewDiverseName] = useState("");
  const [newDiversePrice, setNewDiversePrice] = useState("1C");
  const [newDiverseWeight, setNewDiverseWeight] = useState("0.5KG");
  const [showAddDiverse, setShowAddDiverse] = useState(false);

  const [newFeatureName, setNewFeatureName] = useState("");
  const [newFeatureDesc, setNewFeatureDesc] = useState("");
  const [newFeatureFreq, setNewFeatureFreq] = useState("1X POR TURNO");
  const [newFeatureDamage, setNewFeatureDamage] = useState("1D6");
  const [showAddFeature, setShowAddFeature] = useState(false);

  const [newSpellName, setNewSpellName] = useState("");
  const [newSpellLevel, setNewSpellLevel] = useState(1);
  const [newSpellDamage, setNewSpellDamage] = useState("2D8");
  const [showAddSpell, setShowAddSpell] = useState(false);

  useEffect(() => {
    setData({ ...sheet });
  }, [sheet]);

  if (!isOpen) return null;

  const derived = calculateDerivedStats(data);

  const updateField = <K extends keyof CharacterSheet>(key: K, value: CharacterSheet[K]) => {
    const updated = { ...data, [key]: value, updatedAt: Date.now() };
    setData(updated);
  };

  const handleSave = () => {
    onSave(data);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const updateStatBase = (statKey: "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma", val: number) => {
    const updatedStat: CoreStat = { ...data[statKey], base: Math.max(1, Math.min(30, val || 10)) };
    updateField(statKey, updatedStat);
  };

  const toggleSaveProf = (statKey: keyof CharacterSheet["savingThrowProficiencies"]) => {
    const current = !!data.savingThrowProficiencies?.[statKey];
    updateField("savingThrowProficiencies", {
      ...(data.savingThrowProficiencies || {
        strength: false,
        dexterity: false,
        constitution: false,
        intelligence: false,
        wisdom: false,
        charisma: false,
      }),
      [statKey]: !current,
    });
  };

  const toggleSkillProf = (skillName: string) => {
    const existing = data.skills || [];
    const skillObj = existing.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
    if (skillObj) {
      const updated = existing.map((s) =>
        s.name.toLowerCase() === skillName.toLowerCase() ? { ...s, proficient: !s.proficient } : s
      );
      updateField("skills", updated);
    } else {
      const newSkill: SkillItem = {
        id: `skill-${Date.now()}`,
        name: skillName,
        statKey: "dex",
        proficient: true,
      };
      updateField("skills", [...existing, newSkill]);
    }
  };

  const isSkillProficient = (skillName: string): boolean => {
    return !!data.skills?.some((s) => s.name.toLowerCase() === skillName.toLowerCase() && s.proficient);
  };

  const getSkillModifier = (skillName: string, statKey: "dex" | "str" | "int" | "wis" | "cha"): number => {
    const statMod =
      statKey === "dex"
        ? derived.dexMod
        : statKey === "str"
        ? derived.strMod
        : statKey === "int"
        ? derived.intMod
        : statKey === "wis"
        ? derived.wisMod
        : derived.chaMod;
    const isProf = isSkillProficient(skillName);
    return statMod + (isProf ? derived.proficiencyBonus : 0);
  };

  const handleRoll = (label: string, bonus: number) => {
    if (onRollCheck) {
      onRollCheck(label, bonus);
    }
  };

  // Add items handlers
  const handleAddEquipment = () => {
    if (!newEquipName.trim()) return;
    const newItem: InventoryItem = {
      id: `equip-${Date.now()}`,
      name: newEquipName.trim(),
      quantity: 1,
      weight: parseFloat(newEquipWeight) || 0.5,
      category: "Arma",
      equipped: true,
      damageOrAC: newEquipDamage,
      description: `Preço: ${newEquipPrice} • Tags: ${newEquipTags}`,
    };
    updateField("inventory", [...(data.inventory || []), newItem]);
    setNewEquipName("");
    setShowAddEquip(false);
  };

  const handleAddDiverseItem = () => {
    if (!newDiverseName.trim()) return;
    const newItem: DiverseItem = {
      id: `div-${Date.now()}`,
      name: newDiverseName.trim(),
      price: newDiversePrice,
      weight: newDiverseWeight,
    };
    updateField("diverseItems", [...(data.diverseItems || []), newItem]);
    setNewDiverseName("");
    setShowAddDiverse(false);
  };

  const handleAddFeature = () => {
    if (!newFeatureName.trim()) return;
    const newFeat: FeatureItem = {
      id: `feat-${Date.now()}`,
      name: newFeatureName.trim(),
      description: newFeatureDesc.trim(),
      usageFrequency: newFeatureFreq,
      damage: newFeatureDamage,
    };
    updateField("featuresList", [...(data.featuresList || []), newFeat]);
    setNewFeatureName("");
    setNewFeatureDesc("");
    setShowAddFeature(false);
  };

  const handleAddSpell = () => {
    if (!newSpellName.trim()) return;
    const newSp: SpellItem = {
      id: `sp-${Date.now()}`,
      name: newSpellName.trim(),
      level: newSpellLevel,
      school: "Evocação",
      castingTime: "1 Ação",
      range: "18m",
      components: "V, S",
      duration: "Instantânea",
      description: "Conjura energia arcana.",
      prepared: true,
      damageOrHealing: newSpellDamage,
    };
    updateField("spells", [...(data.spells || []), newSp]);
    setNewSpellName("");
    setShowAddSpell(false);
  };

  // Filtered lists
  const filteredEquip = (data.inventory || []).filter((item) =>
    item.name.toLowerCase().includes(inventorySearch.toLowerCase())
  );
  const filteredDiverse = (data.diverseItems || []).filter((item) =>
    item.name.toLowerCase().includes(diverseSearch.toLowerCase())
  );
  const filteredFeatures = (data.featuresList || []).filter((feat) =>
    feat.name.toLowerCase().includes(featuresSearch.toLowerCase())
  );
  const filteredSpells = (data.spells || []).filter((sp) =>
    sp.name.toLowerCase().includes(spellsSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#15140F] border-2 border-[#38352A] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative text-[#EFE8D8]">
        
        {/* Top Header */}
        <div className="bg-[#1D1B14] border-b border-[#38352A] px-4 py-3 text-center shrink-0 relative">
          <h2 className="text-xl sm:text-2xl font-black font-serif tracking-wide text-[#EFE8D8] uppercase">
            {data.name || "NOVO PERSONAGEM"}
          </h2>
          <p className="text-[11px] font-mono text-[#DFB56C] font-bold tracking-wider uppercase">
            {data.ownerName || "JOGADOR"}
          </p>

          {/* Quick Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-[#A79C82] hover:text-[#EFE8D8] bg-[#15140F] hover:bg-[#232018] border border-[#38352A] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Sheet Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 custom-scrollbar pb-24">
          
          {/* Welcome & Notice Box */}
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-lg">
            <div className="space-y-1 text-xs">
              <p className="font-bold text-[#DFB56C]">Ficha Completa de Personagem</p>
              <p className="text-[#A79C82] text-[11px] leading-relaxed">
                Você pode editar seus atributos, inventário, magias e rolagens diretamente. Todas as alterações são salvas localmente e sincronizadas com a Mesa VTT.
              </p>
            </div>

            {/* Master Avatar portrait */}
            <div className="w-12 h-12 rounded-xl bg-[#15140F] border border-[#DFB56C]/40 flex items-center justify-center shrink-0 overflow-hidden">
              <User className="w-6 h-6 text-[#DFB56C]" />
            </div>
          </div>

          {/* ================= 1. DADOS BÁSICOS ================= */}
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-4 space-y-3 shadow-md">
            <h3 className="text-xs font-black text-[#DFB56C] uppercase font-mono tracking-wider">
              DADOS BÁSICOS
            </h3>

            {/* Avatar Row */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-[#15140F] border-2 border-[#38352A] overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                  {data.avatarUrl ? (
                    <img
                      src={data.avatarUrl}
                      alt={data.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-[#A79C82]" />
                  )}
                </div>
              </div>

              <div className="flex-1">
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">URL do Avatar / Retrato</label>
                <input
                  type="text"
                  value={data.avatarUrl || ""}
                  onChange={(e) => updateField("avatarUrl", e.target.value)}
                  placeholder="https://exemplo.com/avatar.png"
                  className="w-full mt-1 px-3 py-1.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-[10px] font-bold text-[#A79C82] uppercase">NOME DE PERSONAGEM</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[#15140F] border border-[#38352A] rounded-xl text-sm font-bold text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                placeholder="Ex: Urich"
              />
            </div>

            {/* Race / Origin */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">RAÇA/LINHAGEM</label>
                <input
                  type="text"
                  value={data.race || ""}
                  onChange={(e) => updateField("race", e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                  placeholder="Ex: Humano - Bárbaro"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">ORIGEM / ANTECEDENTE</label>
                <input
                  type="text"
                  value={data.origin || data.background || ""}
                  onChange={(e) => {
                    updateField("origin", e.target.value);
                    updateField("background", e.target.value);
                  }}
                  className="w-full mt-1 px-3 py-1.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                  placeholder="Ex: Montanhas do céu"
                />
              </div>
            </div>

            {/* Age / Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">IDADE</label>
                <input
                  type="text"
                  value={data.age || ""}
                  onChange={(e) => updateField("age", e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                  placeholder="17"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">TAMANHO</label>
                <input
                  type="text"
                  value={data.sizeCategory || "Médio (2,05m)"}
                  onChange={(e) => updateField("sizeCategory", e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                  placeholder="2,05"
                />
              </div>
            </div>

            {/* Class & Level / Multiclass & Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#A79C82] uppercase">CLASSE</label>
                  <input
                    type="text"
                    value={data.characterClass}
                    onChange={(e) => updateField("characterClass", e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs font-bold text-[#EFE8D8]"
                    placeholder="Bárbaro"
                  />
                </div>
                <div className="w-20">
                  <label className="text-[10px] font-bold text-[#A79C82] uppercase">NÍVEL</label>
                  <div className="flex items-center gap-1 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl px-2 py-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#DFB56C]" />
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={data.level}
                      onChange={(e) => updateField("level", parseInt(e.target.value) || 1)}
                      className="w-full bg-transparent text-xs font-bold text-[#EFE8D8] text-center focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-[#A79C82] uppercase">MULTICLASSE</label>
                  <input
                    type="text"
                    value={data.multiclass || ""}
                    onChange={(e) => updateField("multiclass", e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs font-bold text-[#EFE8D8]"
                    placeholder="Guerreiro"
                  />
                </div>
                <div className="w-20">
                  <label className="text-[10px] font-bold text-[#A79C82] uppercase">NÍVEL</label>
                  <div className="flex items-center gap-1 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl px-2 py-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-[#DFB56C]" />
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={data.multiclassLevel || 0}
                      onChange={(e) => updateField("multiclassLevel", parseInt(e.target.value) || 0)}
                      className="w-full bg-transparent text-xs font-bold text-[#EFE8D8] text-center focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ================= 2. SAÚDE E ECONOMIA ================= */}
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-4 space-y-3 shadow-md">
            <h3 className="text-xs font-black text-[#DFB56C] uppercase font-mono tracking-wider">
              SAÚDE E ECONOMIA
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Pontos de Vida Stepper */}
              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase flex items-center gap-1">
                  <span>PONTOS DE VIDA</span>
                  <span className="text-[#8DAE8F]">💚</span>
                </label>
                <div className="flex items-center gap-2 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl p-1">
                  <button
                    onClick={() => updateField("currentHp", Math.max(0, data.currentHp - 1))}
                    className="w-8 h-8 bg-[#1D1B14] hover:bg-[#7A2E27]/30 border border-[#38352A] rounded-lg font-black text-base text-[#C4645A] flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={data.currentHp}
                    onChange={(e) => updateField("currentHp", parseInt(e.target.value) || 0)}
                    className="flex-1 bg-transparent text-center font-bold text-sm text-[#EFE8D8] focus:outline-none"
                  />
                  <button
                    onClick={() => updateField("currentHp", Math.min(data.maxHpOverride || 30, data.currentHp + 1))}
                    className="w-8 h-8 bg-[#1D1B14] hover:bg-[#4B6B4E]/30 border border-[#38352A] rounded-lg font-black text-base text-[#8DAE8F] flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Pontos de Vida Temporários Stepper */}
              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase flex items-center gap-1">
                  <span>PONTOS DE VIDA TEMPORÁRIOS</span>
                  <span className="text-[#DFB56C]">🛡️</span>
                </label>
                <div className="flex items-center gap-2 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl p-1">
                  <button
                    onClick={() => updateField("tempHp", Math.max(0, data.tempHp - 1))}
                    className="w-8 h-8 bg-[#1D1B14] hover:bg-[#7A2E27]/30 border border-[#38352A] rounded-lg font-black text-base text-[#C4645A] flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={data.tempHp}
                    onChange={(e) => updateField("tempHp", parseInt(e.target.value) || 0)}
                    className="flex-1 bg-transparent text-center font-bold text-sm text-[#EFE8D8] focus:outline-none"
                  />
                  <button
                    onClick={() => updateField("tempHp", data.tempHp + 1)}
                    className="w-8 h-8 bg-[#1D1B14] hover:bg-[#4B6B4E]/30 border border-[#38352A] rounded-lg font-black text-base text-[#8DAE8F] flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Peças de Ouro / Vida Máxima / XP */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">PEÇAS DE OURO</label>
                <div className="flex items-center gap-1.5 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl px-3 py-1.5">
                  <Coins className="w-3.5 h-3.5 text-[#DFB56C]" />
                  <input
                    type="number"
                    value={data.currency?.gp || 0}
                    onChange={(e) =>
                      updateField("currency", { ...data.currency, gp: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-transparent text-xs font-bold text-[#EFE8D8] focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">VIDA MÁXIMA</label>
                <div className="flex items-center gap-1.5 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl px-3 py-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#8DAE8F]" />
                  <input
                    type="number"
                    value={data.maxHpOverride || 30}
                    onChange={(e) => updateField("maxHpOverride", parseInt(e.target.value) || 30)}
                    className="w-full bg-transparent text-xs font-bold text-[#EFE8D8] focus:outline-none"
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">XP OBTIDO</label>
                <div className="flex items-center gap-1.5 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl px-3 py-1.5">
                  <ChevronUp className="w-3.5 h-3.5 text-[#DFB56C]" />
                  <input
                    type="number"
                    value={data.xp || 0}
                    onChange={(e) => updateField("xp", parseInt(e.target.value) || 0)}
                    className="w-full bg-transparent text-xs font-bold text-[#EFE8D8] focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ================= 3. COMBATE ================= */}
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-4 space-y-3 shadow-md">
            <h3 className="text-xs font-black text-[#DFB56C] uppercase font-mono tracking-wider">
              COMBATE
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">CLASSE DE ARMADURA (CA)</label>
                <div className="flex items-center gap-2 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl px-3 py-2">
                  <Shield className="w-4 h-4 text-[#DFB56C]" />
                  <input
                    type="number"
                    value={data.equippedArmorBonus ? 10 + data.equippedArmorBonus : derived.totalAC}
                    onChange={(e) => updateField("equippedArmorBonus", (parseInt(e.target.value) || 10) - 10)}
                    className="w-full bg-transparent text-sm font-bold text-[#EFE8D8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">INICIATIVA</label>
                <div className="flex items-center gap-2 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl px-3 py-2">
                  <Flag className="w-4 h-4 text-[#DFB56C]" />
                  <input
                    type="number"
                    value={derived.initiative}
                    onChange={(e) => updateField("initiativeBonus", (parseInt(e.target.value) || 0) - derived.dexMod)}
                    className="w-full bg-transparent text-sm font-bold text-[#EFE8D8] focus:outline-none"
                  />
                  <button
                    onClick={() => handleRoll("Iniciativa", derived.initiative)}
                    className="p-1 bg-[#1D1B14] hover:bg-[#232018] text-[#DFB56C] border border-[#38352A] rounded-lg text-xs font-bold cursor-pointer"
                    title="Rolar Iniciativa"
                  >
                    🎲
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">MOVIMENTO</label>
                <div className="flex items-center gap-2 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl px-3 py-2">
                  <Footprints className="w-4 h-4 text-[#DFB56C]" />
                  <input
                    type="text"
                    value={data.speed ? `${data.speed}m / 30ft` : "9m / 30ft"}
                    onChange={(e) => updateField("speed", parseInt(e.target.value) || 9)}
                    className="w-full bg-transparent text-sm font-bold text-[#EFE8D8] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ================= 4. HABILIDADES / ATRIBUTOS ================= */}
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-4 space-y-3 shadow-md">
            <h3 className="text-xs font-black text-[#DFB56C] uppercase font-mono tracking-wider">
              HABILIDADES / ATRIBUTOS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "DESTREZA (DES)", key: "dexterity", mod: derived.dexMod },
                { label: "FORÇA (FOR)", key: "strength", mod: derived.strMod },
                { label: "CONSTITUIÇÃO (CON)", key: "constitution", mod: derived.conMod },
                { label: "INTELIGÊNCIA (INT)", key: "intelligence", mod: derived.intMod },
                { label: "SABEDORIA (SAB)", key: "wisdom", mod: derived.wisMod },
                { label: "CARISMA (CAR)", key: "charisma", mod: derived.chaMod },
              ].map((stat) => (
                <div key={stat.key} className="space-y-1">
                  <label className="text-[10px] font-bold text-[#A79C82] uppercase">{stat.label}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Score box */}
                    <input
                      type="number"
                      value={data[stat.key as "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma"]?.base || 10}
                      onChange={(e) =>
                        updateStatBase(
                          stat.key as "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma",
                          parseInt(e.target.value) || 10
                        )
                      }
                      className="px-3 py-2 bg-[#15140F] border border-[#38352A] rounded-xl text-center font-bold text-sm text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                    />

                    {/* Modifier box with roll button */}
                    <button
                      onClick={() => handleRoll(`Teste de ${stat.label}`, stat.mod)}
                      className="px-3 py-2 bg-[#15140F] border border-[#38352A] hover:border-[#DFB56C] rounded-xl flex items-center justify-between text-xs font-bold text-[#EFE8D8] transition-colors cursor-pointer group"
                      title={`Clique para rolar 1d20 + ${stat.mod}`}
                    >
                      <span className="text-[#DFB56C] group-hover:scale-110 transition-transform">+</span>
                      <span className="font-mono text-sm text-[#DFB56C]">{stat.mod >= 0 ? `+${stat.mod}` : stat.mod}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ================= 5. PERCEPÇÃO PASSIVA, PROFICIÊNCIA & INSPIRAÇÃO ================= */}
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-4 space-y-3 shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">PERCEPÇÃO PASSIVA</label>
                <div className="flex items-center gap-2 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl px-3 py-2">
                  <Compass className="w-4 h-4 text-[#DFB56C]" />
                  <input
                    type="number"
                    value={derived.passivePerception}
                    onChange={(e) => updateField("passivePerceptionBonus", parseInt(e.target.value) || 10)}
                    className="w-full bg-transparent text-xs font-bold text-[#EFE8D8] focus:outline-none"
                  />
                  <Star className="w-3.5 h-3.5 text-[#DFB56C]" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">BÔNUS DE PROFICIÊNCIA</label>
                <div className="flex items-center gap-2 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl px-3 py-2">
                  <Star className="w-4 h-4 text-[#DFB56C]" />
                  <input
                    type="number"
                    value={derived.proficiencyBonus}
                    onChange={(e) => updateField("proficiencyBonusOverride", parseInt(e.target.value) || 2)}
                    className="w-full bg-transparent text-xs font-bold text-[#EFE8D8] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">INSPIRAÇÃO</label>
                <div className="flex items-center gap-2 mt-1 bg-[#15140F] border border-[#38352A] rounded-xl px-3 py-2">
                  <Sparkles className="w-4 h-4 text-[#DFB56C]" />
                  <input
                    type="text"
                    value={data.inspiration ? "Ativa ⭐" : "Inativa"}
                    onClick={() => updateField("inspiration", !data.inspiration)}
                    readOnly
                    className="w-full bg-transparent text-xs font-bold text-[#DFB56C] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Languages, Armor Training, Tools */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">IDIOMAS CONHECIDOS</label>
                <textarea
                  value={data.languages || "Língua tribal (Nortista)\nLíngua imperial (comum)"}
                  onChange={(e) => updateField("languages", e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">TREINAMENTO EM ARMAS E ARMADURAS</label>
                <textarea
                  value={data.armorAndWeaponTraining || "Armaduras leves, médias e escudos. Armas simples e marciais."}
                  onChange={(e) => updateField("armorAndWeaponTraining", e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">FERRAMENTAS, INSTRUMENTOS E JOGOS</label>
                <textarea
                  value={data.toolsAndInstruments || "Kit de herbalismo, dados de osso."}
                  onChange={(e) => updateField("toolsAndInstruments", e.target.value)}
                  rows={2}
                  className="w-full mt-1 p-2.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                />
              </div>
            </div>
          </div>

          {/* ================= 6. TESTES DE RESISTÊNCIA À MORTE ================= */}
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-4 space-y-3 shadow-md">
            <h3 className="text-xs font-black text-[#DFB56C] uppercase font-mono tracking-wider">
              TESTES DE RESISTÊNCIA À MORTE
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Sucessos */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#8DAE8F] uppercase">SUCESSOS</label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3].map((num) => {
                    const active = (data.deathSaves?.successes || 0) >= num;
                    return (
                      <button
                        key={num}
                        onClick={() =>
                          updateField("deathSaves", {
                            successes: active ? num - 1 : num,
                            failures: data.deathSaves?.failures || 0,
                          })
                        }
                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                          active
                            ? "bg-[#4B6B4E] border-[#8DAE8F] text-[#EFE8D8]"
                            : "bg-[#15140F] border-[#38352A] text-transparent"
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Falhas */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#C4645A] uppercase">FALHAS</label>
                <div className="flex items-center gap-3">
                  {[1, 2, 3].map((num) => {
                    const active = (data.deathSaves?.failures || 0) >= num;
                    return (
                      <button
                        key={num}
                        onClick={() =>
                          updateField("deathSaves", {
                            successes: data.deathSaves?.successes || 0,
                            failures: active ? num - 1 : num,
                          })
                        }
                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                          active
                            ? "bg-[#7A2E27] border-[#C4645A] text-white"
                            : "bg-[#15140F] border-[#38352A] text-transparent"
                        }`}
                      >
                        <X className="w-4 h-4 stroke-[3]" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ================= 7. TESTES DE RESISTÊNCIA (Saving Throws) ================= */}
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-4 space-y-3 shadow-md">
            <h3 className="text-xs font-black text-[#DFB56C] uppercase font-mono tracking-wider">
              TESTES DE RESISTÊNCIA
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: "FOR", key: "strength", mod: derived.savingThrows.strength },
                { label: "DES", key: "dexterity", mod: derived.savingThrows.dexterity },
                { label: "CON", key: "constitution", mod: derived.savingThrows.constitution },
                { label: "INT", key: "intelligence", mod: derived.savingThrows.intelligence },
                { label: "SAB", key: "wisdom", mod: derived.savingThrows.wisdom },
                { label: "CAR", key: "charisma", mod: derived.savingThrows.charisma },
              ].map((sv) => {
                const isProf = !!data.savingThrowProficiencies?.[sv.key as keyof typeof data.savingThrowProficiencies];
                return (
                  <div key={sv.key} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#A79C82]">
                      <span>{sv.label}</span>
                      <button
                        onClick={() => toggleSaveProf(sv.key as keyof typeof data.savingThrowProficiencies)}
                        className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          isProf
                            ? "bg-[#DFB56C] text-[#15140F] border-[#DFB56C] font-bold"
                            : "bg-[#15140F] text-[#A79C82] border-[#38352A]"
                        }`}
                      >
                        {isProf ? "PROF" : "NORMAL"}
                      </button>
                    </div>

                    <button
                      onClick={() => handleRoll(`Resistência de ${sv.label}`, sv.mod)}
                      className="w-full px-3 py-2 bg-[#15140F] border border-[#38352A] hover:border-[#DFB56C] rounded-xl flex items-center justify-between text-xs font-bold text-[#EFE8D8] transition-colors cursor-pointer group"
                    >
                      <span className="text-[#DFB56C] group-hover:scale-110 transition-transform">+</span>
                      <span className="font-mono text-sm text-[#DFB56C]">{sv.mod >= 0 ? `+${sv.mod}` : sv.mod}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= 8. PERÍCIAS (Skills) ================= */}
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-4 space-y-3 shadow-md">
            <h3 className="text-xs font-black text-[#DFB56C] uppercase font-mono tracking-wider">
              PERÍCIAS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ALL_DND_SKILLS.map((sk) => {
                const mod = getSkillModifier(sk.name, sk.statKey);
                const isProf = isSkillProficient(sk.name);

                return (
                  <div
                    key={sk.id}
                    className="p-2.5 bg-[#15140F] border border-[#38352A] rounded-xl flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => toggleSkillProf(sk.name)}
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
                          isProf
                            ? "bg-[#DFB56C] border-[#DFB56C] text-[#15140F]"
                            : "bg-[#1D1B14] border-[#38352A] text-transparent"
                        }`}
                        title="Alternar Proficiência"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </button>

                      <div className="truncate">
                        <p className="text-[11px] font-bold text-[#EFE8D8] truncate">
                          {sk.name} <span className="text-[#A79C82] text-[10px]">({sk.statKey.toUpperCase()})</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRoll(`Perícia: ${sk.name}`, mod)}
                      className="px-2.5 py-1 bg-[#1D1B14] border border-[#38352A] hover:border-[#DFB56C] rounded-lg text-xs font-bold text-[#DFB56C] flex items-center gap-1 transition-colors cursor-pointer group shrink-0"
                      title="Rolar Teste de Perícia"
                    >
                      <Plus className="w-3 h-3 group-hover:scale-120 transition-transform" />
                      <span className="font-mono">{mod >= 0 ? `+${mod}` : mod}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= 9. INVENTÁRIO & EQUIPAMENTOS ================= */}
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-4 space-y-4 shadow-md">
            <h3 className="text-xs font-black text-[#DFB56C] uppercase font-mono tracking-wider">
              INVENTÁRIO & EQUIPAMENTOS
            </h3>

            {/* Equipamentos Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">EQUIPAMENTOS DE COMBATE</label>
                <button
                  onClick={() => setShowAddEquip(!showAddEquip)}
                  className="text-xs font-bold text-[#8DAE8F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>

              {showAddEquip && (
                <div className="p-3 bg-[#15140F] border border-[#38352A] rounded-xl space-y-2 text-xs animate-in fade-in">
                  <input
                    type="text"
                    value={newEquipName}
                    onChange={(e) => setNewEquipName(e.target.value)}
                    placeholder="Nome do Equipamento (Ex: Espada Curta)"
                    className="w-full px-3 py-1.5 bg-[#1D1B14] border border-[#38352A] rounded-lg text-[#EFE8D8]"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newEquipPrice}
                      onChange={(e) => setNewEquipPrice(e.target.value)}
                      placeholder="Preço (25G)"
                      className="px-2 py-1 bg-[#1D1B14] border border-[#38352A] rounded-lg text-[#EFE8D8] text-xs"
                    />
                    <input
                      type="text"
                      value={newEquipDamage}
                      onChange={(e) => setNewEquipDamage(e.target.value)}
                      placeholder="Dano (1D6)"
                      className="px-2 py-1 bg-[#1D1B14] border border-[#38352A] rounded-lg text-[#EFE8D8] text-xs"
                    />
                    <input
                      type="text"
                      value={newEquipWeight}
                      onChange={(e) => setNewEquipWeight(e.target.value)}
                      placeholder="Peso (0.5KG)"
                      className="px-2 py-1 bg-[#1D1B14] border border-[#38352A] rounded-lg text-[#EFE8D8] text-xs"
                    />
                  </div>
                  <button
                    onClick={handleAddEquipment}
                    className="w-full py-1.5 bg-[#DFB56C] hover:bg-[#F3CF8A] text-[#15140F] font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Salvar Equipamento
                  </button>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#A79C82]" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Filtrar equipamentos..."
                  className="w-full pl-9 pr-3 py-1.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {filteredEquip.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#15140F] border border-[#38352A] rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#EFE8D8] text-xs uppercase">{item.name}</span>
                      <button
                        onClick={() => updateField("inventory", (data.inventory || []).filter((i) => i.id !== item.id))}
                        className="text-[#C4645A] hover:text-[#EFE8D8] p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Tag Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                      <span className="px-2 py-0.5 bg-[#DFB56C] text-[#15140F] rounded-md font-mono">
                        🪙 PREÇO 25G
                      </span>
                      {item.damageOrAC && (
                        <span className="px-2 py-0.5 bg-[#7A2E27] text-white rounded-md font-mono">
                          🗡️ DANO {item.damageOrAC}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-[#1D1B14] border border-[#38352A] text-[#D6CEBE] rounded-md font-mono">
                        ⚖️ PESO {item.weight}KG
                      </span>
                      <span className="px-2 py-0.5 bg-[#1D1B14] border border-[#38352A] text-[#DFB56C] rounded-md">
                        🏷️ ÁGIL, LEVE
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Itens Diversos Section */}
            <div className="space-y-2 pt-2 border-t border-[#38352A]">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">ITENS DIVERSOS & CONSUMÍVEIS</label>
                <button
                  onClick={() => setShowAddDiverse(!showAddDiverse)}
                  className="text-xs font-bold text-[#8DAE8F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>

              {showAddDiverse && (
                <div className="p-3 bg-[#15140F] border border-[#38352A] rounded-xl space-y-2 text-xs animate-in fade-in">
                  <input
                    type="text"
                    value={newDiverseName}
                    onChange={(e) => setNewDiverseName(e.target.value)}
                    placeholder="Nome do Item Diverso (Ex: Tocha, Corda)"
                    className="w-full px-3 py-1.5 bg-[#1D1B14] border border-[#38352A] rounded-lg text-[#EFE8D8]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newDiversePrice}
                      onChange={(e) => setNewDiversePrice(e.target.value)}
                      placeholder="Preço (1C)"
                      className="px-2 py-1 bg-[#1D1B14] border border-[#38352A] rounded-lg text-[#EFE8D8] text-xs"
                    />
                    <input
                      type="text"
                      value={newDiverseWeight}
                      onChange={(e) => setNewDiverseWeight(e.target.value)}
                      placeholder="Peso (0.5KG)"
                      className="px-2 py-1 bg-[#1D1B14] border border-[#38352A] rounded-lg text-[#EFE8D8] text-xs"
                    />
                  </div>
                  <button
                    onClick={handleAddDiverseItem}
                    className="w-full py-1.5 bg-[#DFB56C] hover:bg-[#F3CF8A] text-[#15140F] font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Salvar Item
                  </button>
                </div>
              )}

              {/* Diverse Items List */}
              <div className="space-y-2">
                {filteredDiverse.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-[#15140F] border border-[#38352A] rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-[#EFE8D8] text-xs uppercase">{item.name}</span>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono">
                        <span className="px-2 py-0.5 bg-[#DFB56C] text-[#15140F] rounded font-bold">
                          PREÇO {item.price || "1C"}
                        </span>
                        <span className="px-2 py-0.5 bg-[#1D1B14] text-[#A79C82] rounded border border-[#38352A]">
                          PESO {item.weight || "0.5KG"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => updateField("diverseItems", (data.diverseItems || []).filter((i) => i.id !== item.id))}
                      className="text-[#C4645A] hover:text-[#EFE8D8] p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Equipamentos Slots (Mão Esquerda, Direita, Armadura, Acessórios) */}
            <div className="space-y-2 pt-2 border-t border-[#38352A]">
              <label className="text-[10px] font-bold text-[#DFB56C] uppercase">SLOTS EQUIPADOS</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "MÃO ESQUERDA", key: "leftHand", placeholder: "Escudo / Adaga" },
                  { label: "MÃO DIREITA", key: "rightHand", placeholder: "Espada Longa" },
                  { label: "ARMADURA", key: "armor", placeholder: "Cota de Malha" },
                  { label: "ACESSÓRIOS", key: "accessories", placeholder: "Anel de Proteção" },
                ].map((slot) => (
                  <div key={slot.key} className="p-3 bg-[#15140F] border border-[#38352A] rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-[#A79C82] uppercase">{slot.label}</span>
                    <input
                      type="text"
                      value={data.equippedSlots?.[slot.key as keyof typeof data.equippedSlots] || ""}
                      onChange={(e) =>
                        updateField("equippedSlots", {
                          ...data.equippedSlots,
                          [slot.key]: e.target.value,
                        })
                      }
                      placeholder={slot.placeholder}
                      className="w-full px-2.5 py-1.5 bg-[#1D1B14] border border-[#38352A] rounded-lg text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= 10. MAGIAS E HABILIDADES DE CLASSE/RAÇA ================= */}
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-4 space-y-4 shadow-md">
            <h3 className="text-xs font-black text-[#DFB56C] uppercase font-mono tracking-wider">
              MAGIAS E HABILIDADES DE CLASSE/RAÇA
            </h3>

            {/* Habilidades Adicionais */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">HABILIDADES ADICIONAIS</label>
                <button
                  onClick={() => setShowAddFeature(!showAddFeature)}
                  className="text-xs font-bold text-[#8DAE8F] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>

              {showAddFeature && (
                <div className="p-3 bg-[#15140F] border border-[#38352A] rounded-xl space-y-2 text-xs animate-in fade-in">
                  <input
                    type="text"
                    value={newFeatureName}
                    onChange={(e) => setNewFeatureName(e.target.value)}
                    placeholder="Nome da Habilidade (Ex: Ataque Furtivo)"
                    className="w-full px-3 py-1.5 bg-[#1D1B14] border border-[#38352A] rounded-lg text-[#EFE8D8]"
                  />
                  <textarea
                    value={newFeatureDesc}
                    onChange={(e) => setNewFeatureDesc(e.target.value)}
                    placeholder="Descrição da Habilidade..."
                    rows={2}
                    className="w-full px-3 py-1.5 bg-[#1D1B14] border border-[#38352A] rounded-lg text-[#EFE8D8]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newFeatureFreq}
                      onChange={(e) => setNewFeatureFreq(e.target.value)}
                      placeholder="Frequência (1X POR TURNO)"
                      className="px-2 py-1 bg-[#1D1B14] border border-[#38352A] rounded-lg text-[#EFE8D8] text-xs"
                    />
                    <input
                      type="text"
                      value={newFeatureDamage}
                      onChange={(e) => setNewFeatureDamage(e.target.value)}
                      placeholder="Dano Extra (1D6)"
                      className="px-2 py-1 bg-[#1D1B14] border border-[#38352A] rounded-lg text-[#EFE8D8] text-xs"
                    />
                  </div>
                  <button
                    onClick={handleAddFeature}
                    className="w-full py-1.5 bg-[#DFB56C] hover:bg-[#F3CF8A] text-[#15140F] font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    Salvar Habilidade
                  </button>
                </div>
              )}

              {/* Features List */}
              <div className="space-y-2">
                {filteredFeatures.map((feat) => (
                  <div
                    key={feat.id}
                    className="p-3.5 bg-[#15140F] border border-[#38352A] rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#EFE8D8] text-xs uppercase">{feat.name}</span>
                      <button
                        onClick={() => updateField("featuresList", (data.featuresList || []).filter((f) => f.id !== feat.id))}
                        className="text-[#C4645A] hover:text-[#EFE8D8] p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-[#D6CEBE] leading-relaxed">{feat.description}</p>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                      {feat.usageFrequency && (
                        <span className="px-2 py-0.5 bg-[#1D1B14] border border-[#38352A] text-[#DFB56C] rounded-md font-mono">
                          🔄 {feat.usageFrequency}
                        </span>
                      )}
                      {feat.damage && (
                        <span className="px-2 py-0.5 bg-[#7A2E27] text-white rounded-md font-mono">
                          🗡️ DANO {feat.damage}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Spellcasting Attributes & Modifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#38352A]">
              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">ATRIBUTO DE CONJURAÇÃO</label>
                <select
                  value={data.spellcastingAbility || "int"}
                  onChange={(e) => updateField("spellcastingAbility", e.target.value as "int" | "wis" | "cha")}
                  className="w-full mt-1 px-3 py-2 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] font-bold"
                >
                  <option value="int">Inteligência (INT)</option>
                  <option value="wis">Sabedoria (SAB)</option>
                  <option value="cha">Carisma (CAR)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">BÔNUS DE CONJURAÇÃO</label>
                <input
                  type="number"
                  value={derived.spellAttackBonus}
                  onChange={(e) => updateField("spellcastingBonus", parseInt(e.target.value) || 0)}
                  className="w-full mt-1 px-3 py-2 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] font-bold"
                />
              </div>
            </div>

            {/* Spell Slots Steppers */}
            <div className="space-y-2 pt-2 border-t border-[#38352A]">
              <label className="text-[10px] font-bold text-[#DFB56C] uppercase">ESPAÇOS DE MAGIA</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { label: "ESPAÇOS DE TRUQUES", level: 0 },
                  { label: "ESPAÇOS (NÍVEL 1)", level: 1 },
                  { label: "ESPAÇOS (NÍVEL 2)", level: 2 },
                  { label: "ESPAÇOS (NÍVEL 3)", level: 3 },
                  { label: "ESPAÇOS (NÍVEL 4)", level: 4 },
                  { label: "ESPAÇOS (NÍVEL 5)", level: 5 },
                  { label: "ESPAÇOS (NÍVEL 6)", level: 6 },
                  { label: "ESPAÇOS (NÍVEL 7)", level: 7 },
                  { label: "ESPAÇOS (NÍVEL 8)", level: 8 },
                  { label: "ESPAÇOS (NÍVEL 9)", level: 9 },
                ].map((slot) => {
                  const currentUsed = data.spellSlots?.[slot.level]?.used || 0;
                  const currentTotal = data.spellSlots?.[slot.level]?.total || (slot.level === 1 ? 4 : slot.level <= 3 ? 3 : 2);
                  return (
                    <div key={slot.level} className="p-2 bg-[#15140F] border border-[#38352A] rounded-xl space-y-1">
                      <span className="text-[9px] font-bold text-[#A79C82] block truncate">{slot.label}</span>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            const newUsed = Math.max(0, currentUsed - 1);
                            updateField("spellSlots", {
                              ...data.spellSlots,
                              [slot.level]: { total: currentTotal, used: newUsed },
                            });
                          }}
                          className="w-6 h-6 bg-[#1D1B14] hover:bg-[#7A2E27]/30 border border-[#38352A] rounded font-bold text-xs text-[#C4645A]"
                        >
                          -
                        </button>
                        <span className="text-xs font-mono font-bold text-[#EFE8D8]">
                          {currentTotal - currentUsed} / {currentTotal}
                        </span>
                        <button
                          onClick={() => {
                            const newUsed = Math.min(currentTotal, currentUsed + 1);
                            updateField("spellSlots", {
                              ...data.spellSlots,
                              [slot.level]: { total: currentTotal, used: newUsed },
                            });
                          }}
                          className="w-6 h-6 bg-[#1D1B14] hover:bg-[#4B6B4E]/30 border border-[#38352A] rounded font-bold text-xs text-[#8DAE8F]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ================= 11. ANOTAÇÕES ================= */}
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-4 space-y-3 shadow-md">
            <h3 className="text-xs font-black text-[#DFB56C] uppercase font-mono tracking-wider">
              ANOTAÇÕES
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">MISSÕES</label>
                <textarea
                  value={data.notesStructure?.missions || ""}
                  onChange={(e) =>
                    updateField("notesStructure", {
                      ...data.notesStructure,
                      missions: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Anotações de missões ativas..."
                  className="w-full mt-1 p-2.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">ALIANÇAS, ORGANIZAÇÕES ETC.</label>
                <textarea
                  value={data.notesStructure?.alliances || ""}
                  onChange={(e) =>
                    updateField("notesStructure", {
                      ...data.notesStructure,
                      alliances: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Guildas, deuses e facções..."
                  className="w-full mt-1 p-2.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">LEMBRETES</label>
                <textarea
                  value={data.notesStructure?.reminders || ""}
                  onChange={(e) =>
                    updateField("notesStructure", {
                      ...data.notesStructure,
                      reminders: e.target.value,
                    })
                  }
                  rows={2}
                  placeholder="Lembretes para a próxima sessão..."
                  className="w-full mt-1 p-2.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#A79C82] uppercase">OUTRAS NOTAS</label>
                <textarea
                  value={data.notesStructure?.otherNotes || data.notes || ""}
                  onChange={(e) => {
                    updateField("notesStructure", {
                      ...data.notesStructure,
                      otherNotes: e.target.value,
                    });
                    updateField("notes", e.target.value);
                  }}
                  rows={2}
                  placeholder="Segredos, itens especiais..."
                  className="w-full mt-1 p-2.5 bg-[#15140F] border border-[#38352A] rounded-xl text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ================= FIXED BOTTOM ACTION BAR ================= */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-[#1D1B14]/95 border-t border-[#38352A] px-4 sm:px-6 flex items-center justify-between z-30 backdrop-blur-md shadow-2xl">
          {/* Left: Switch Character */}
          <div className="relative">
            <button
              onClick={() => setShowCharList(!showCharList)}
              className="p-2.5 bg-[#15140F] border border-[#38352A] hover:border-[#DFB56C] text-[#DFB56C] rounded-2xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
              title="Trocar de Personagem"
            >
              <Users className="w-5 h-5" />
            </button>

            {/* Character switcher popup */}
            {showCharList && characters.length > 0 && (
              <div className="absolute bottom-16 left-0 w-64 bg-[#1D1B14] border border-[#38352A] rounded-2xl p-2 shadow-2xl space-y-1 animate-in fade-in zoom-in-95">
                <p className="text-[10px] font-mono text-[#DFB56C] uppercase px-2 py-1 font-bold">Selecione uma Ficha</p>
                {characters.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      if (onSelectCharacter) onSelectCharacter(c);
                      setData({ ...c });
                      setShowCharList(false);
                    }}
                    className="w-full px-3 py-2 text-left bg-[#15140F] hover:bg-[#232018] rounded-xl text-xs font-bold text-[#EFE8D8] flex items-center justify-between cursor-pointer"
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] text-[#A79C82]">Nív {c.level}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Center: Save Button */}
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#DFB56C] hover:bg-[#F3CF8A] text-[#15140F] font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-xl transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Save className="w-5 h-5" />
            <span>{saveSuccess ? "Salvo com Sucesso!" : "Salvar Ficha"}</span>
          </button>

          {/* Right: Close Button */}
          <button
            onClick={onClose}
            className="p-2.5 bg-[#15140F] border border-[#38352A] hover:border-[#C4645A] text-[#A79C82] hover:text-[#C4645A] rounded-2xl transition-colors cursor-pointer shadow-md"
            title="Fechar Ficha"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
