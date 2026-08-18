import React, { useState } from "react";
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
} from "lucide-react";
import { CharacterSheet, SkillItem, TempConditionEffect, SpellItem, InventoryItem } from "../../types";
import { calculateDerivedStats, calculateStatMod } from "../../utils/characterCalculations";

interface CharacterSheetModalProps {
  isOpen: boolean;
  sheet: CharacterSheet;
  onClose: () => void;
  onSave: (updated: CharacterSheet) => void;
  onRollCheck?: (label: string, bonus: number) => void;
}

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({
  isOpen,
  sheet,
  onClose,
  onSave,
  onRollCheck,
}) => {
  const [data, setData] = useState<CharacterSheet>({ ...sheet });
  const [activeTab, setActiveTab] = useState<"stats" | "skills" | "spells" | "inventory" | "buffs" | "bio">("stats");
  const [newBuffName, setNewBuffName] = useState("");
  const [newBuffAc, setNewBuffAc] = useState(0);
  const [newBuffSave, setNewBuffSave] = useState(0);
  const [newBuffAttack, setNewBuffAttack] = useState(0);

  if (!isOpen) return null;

  const derived = calculateDerivedStats(data);

  const updateField = <K extends keyof CharacterSheet>(key: K, value: CharacterSheet[K]) => {
    const updated = { ...data, [key]: value, updatedAt: Date.now() };
    setData(updated);
    onSave(updated);
  };

  const updateStatBase = (statKey: "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma", val: number) => {
    const updatedStat = { ...data[statKey], base: Math.max(1, Math.min(30, val)) };
    updateField(statKey, updatedStat);
  };

  const updateStatTemp = (statKey: "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma", val: number) => {
    const updatedStat = { ...data[statKey], tempBonus: val };
    updateField(statKey, updatedStat);
  };

  const toggleSaveProf = (statKey: keyof CharacterSheet["savingThrowProficiencies"]) => {
    const current = !!data.savingThrowProficiencies[statKey];
    updateField("savingThrowProficiencies", {
      ...data.savingThrowProficiencies,
      [statKey]: !current,
    });
  };

  const toggleSkillProf = (skillId: string) => {
    const updatedSkills = data.skills.map((s) => {
      if (s.id === skillId) {
        if (!s.proficient) return { ...s, proficient: true, expertise: false };
        if (s.proficient && !s.expertise) return { ...s, proficient: true, expertise: true };
        return { ...s, proficient: false, expertise: false };
      }
      return s;
    });
    updateField("skills", updatedSkills);
  };

  const handleAddCondition = () => {
    if (!newBuffName.trim()) return;
    const newCondition: TempConditionEffect = {
      id: `cond-${Date.now()}`,
      name: newBuffName.trim(),
      acBonus: newBuffAc || undefined,
      saveBonus: newBuffSave || undefined,
      attackBonus: newBuffAttack || undefined,
    };
    updateField("activeConditions", [...(data.activeConditions || []), newCondition]);
    setNewBuffName("");
    setNewBuffAc(0);
    setNewBuffSave(0);
    setNewBuffAttack(0);
  };

  const handleRemoveCondition = (condId: string) => {
    updateField(
      "activeConditions",
      (data.activeConditions || []).filter((c) => c.id !== condId)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#15140F] border border-[#7A2E27]/50 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with Name, Level, HP, AC Bar */}
        <div className="p-4 bg-[#1C1A14] border-b border-[#38352A] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#7A2E27]/30 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C] font-serif font-bold text-xl shrink-0">
              {data.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="text-lg sm:text-xl font-serif font-bold text-[#EFE8D8] bg-transparent border-b border-transparent hover:border-[#DFB56C]/40 focus:border-[#DFB56C] outline-none px-1"
                />
                <span className="text-xs font-mono text-[#DFB56C] bg-[#DFB56C]/10 border border-[#DFB56C]/30 px-2 py-0.5 rounded">
                  Nv. {data.level} {data.characterClass}
                </span>
              </div>
              <p className="text-xs text-[#A79C82] flex items-center gap-2">
                <span>{data.race || "Raça"}</span> • <span>{data.system}</span> • <span>{data.alignment}</span>
              </p>
            </div>
          </div>

          {/* Quick HP & AC stats badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 bg-[#15140F] border border-[#38352A] px-3 py-1.5 rounded-xl">
              <Heart className="w-4 h-4 text-[#C4645A]" />
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  value={data.currentHp}
                  onChange={(e) => updateField("currentHp", parseInt(e.target.value) || 0)}
                  className="w-12 text-center text-sm font-bold font-mono text-[#EFE8D8] bg-transparent border-b border-[#C4645A]/40 outline-none"
                />
                <span className="text-xs font-mono text-[#A79C82]">/ {derived.totalMaxHp} PV</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-[#15140F] border border-[#38352A] px-3 py-1.5 rounded-xl">
              <Shield className="w-4 h-4 text-[#7E9FB0]" />
              <span className="text-sm font-bold font-mono text-[#EFE8D8]">{derived.totalAC} CA</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#25231B] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 border-b border-[#38352A] bg-[#12110D] overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "stats"
                ? "border-[#DFB56C] text-[#DFB56C] bg-[#DFB56C]/5"
                : "border-transparent text-[#A79C82] hover:text-[#EFE8D8]"
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>Atributos & Combate</span>
          </button>
          <button
            onClick={() => setActiveTab("skills")}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "skills"
                ? "border-[#DFB56C] text-[#DFB56C] bg-[#DFB56C]/5"
                : "border-transparent text-[#A79C82] hover:text-[#EFE8D8]"
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Perícias & Salvaguardas</span>
          </button>
          <button
            onClick={() => setActiveTab("spells")}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "spells"
                ? "border-[#DFB56C] text-[#DFB56C] bg-[#DFB56C]/5"
                : "border-transparent text-[#A79C82] hover:text-[#EFE8D8]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Magias & Habilidades ({data.spells?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "inventory"
                ? "border-[#DFB56C] text-[#DFB56C] bg-[#DFB56C]/5"
                : "border-transparent text-[#A79C82] hover:text-[#EFE8D8]"
            }`}
          >
            <Backpack className="w-3.5 h-3.5" />
            <span>Inventário & Moedas</span>
          </button>
          <button
            onClick={() => setActiveTab("buffs")}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "buffs"
                ? "border-[#DFB56C] text-[#DFB56C] bg-[#DFB56C]/5"
                : "border-transparent text-[#A79C82] hover:text-[#EFE8D8]"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#C4645A]" />
            <span>Buffs & Condições ({data.activeConditions?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab("bio")}
            className={`px-3 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "bio"
                ? "border-[#DFB56C] text-[#DFB56C] bg-[#DFB56C]/5"
                : "border-transparent text-[#A79C82] hover:text-[#EFE8D8]"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Biografia & Notas</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: STATS & COMBAT */}
          {activeTab === "stats" && (
            <div className="space-y-6">
              {/* 6 Core Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { key: "strength" as const, label: "FORÇA", mod: derived.strMod },
                  { key: "dexterity" as const, label: "DESTREZA", mod: derived.dexMod },
                  { key: "constitution" as const, label: "CONSTITUIÇÃO", mod: derived.conMod },
                  { key: "intelligence" as const, label: "INTELIGÊNCIA", mod: derived.intMod },
                  { key: "wisdom" as const, label: "SABEDORIA", mod: derived.wisMod },
                  { key: "charisma" as const, label: "CARISMA", mod: derived.chaMod },
                ].map((stat) => (
                  <div
                    key={stat.key}
                    className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl flex flex-col items-center justify-between text-center relative group hover:border-[#DFB56C]/50 transition-colors"
                  >
                    <span className="text-[10px] font-mono text-[#A79C82] tracking-wider">{stat.label}</span>
                    <button
                      onClick={() => onRollCheck?.(`Teste de ${stat.label}`, stat.mod)}
                      className="my-1.5 w-12 h-12 rounded-xl bg-[#25231B] border border-[#38352A] group-hover:border-[#DFB56C] group-hover:bg-[#DFB56C]/10 flex flex-col items-center justify-center transition-all cursor-pointer"
                      title="Clique para rolar teste deste atributo"
                    >
                      <span className="text-lg font-mono font-bold text-[#EFE8D8] group-hover:text-[#DFB56C]">
                        {stat.mod >= 0 ? `+${stat.mod}` : stat.mod}
                      </span>
                    </button>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-[#A79C82]">
                      <span>Base:</span>
                      <input
                        type="number"
                        value={data[stat.key].base}
                        onChange={(e) => updateStatBase(stat.key, parseInt(e.target.value) || 10)}
                        className="w-8 text-center bg-[#15140F] border border-[#38352A] rounded text-[#EFE8D8] py-0.5 outline-none focus:border-[#DFB56C]"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Combat Summary Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                  <span className="text-[10px] font-mono text-[#A79C82] block">BÔNUS DE PROFICIÊNCIA</span>
                  <span className="text-xl font-bold font-mono text-[#DFB56C]">+{derived.proficiencyBonus}</span>
                </div>
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                  <span className="text-[10px] font-mono text-[#A79C82] block">INICIATIVA</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold font-mono text-[#EFE8D8]">
                      {derived.initiative >= 0 ? `+${derived.initiative}` : derived.initiative}
                    </span>
                    <button
                      onClick={() => onRollCheck?.("Iniciativa", derived.initiative)}
                      className="p-1 text-[#A79C82] hover:text-[#DFB56C] bg-[#25231B] rounded"
                    >
                      <Dice5 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                  <span className="text-[10px] font-mono text-[#A79C82] block">DESLOCAMENTO</span>
                  <span className="text-xl font-bold font-mono text-[#EFE8D8]">{data.speed}m</span>
                </div>
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                  <span className="text-[10px] font-mono text-[#A79C82] block">PERCEPÇÃO PASSIVA</span>
                  <span className="text-xl font-bold font-mono text-[#8DAE8F]">{derived.passivePerception}</span>
                </div>
              </div>

              {/* Spellcasting DC & Attack if configured */}
              <div className="p-4 bg-[#1C1A14] border border-[#38352A] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#DFB56C]" />
                    <span className="text-xs font-mono text-[#EFE8D8] font-bold">CONJURAÇÃO DE MAGIAS</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#A79C82]">Atributo Chave:</span>
                    <select
                      value={data.spellcastingAbility || "int"}
                      onChange={(e) => updateField("spellcastingAbility", e.target.value as any)}
                      className="bg-[#15140F] border border-[#38352A] rounded px-2 py-0.5 text-[#EFE8D8] text-xs"
                    >
                      <option value="int">Inteligência (INT)</option>
                      <option value="wis">Sabedoria (SAB)</option>
                      <option value="cha">Carisma (CAR)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 bg-[#15140F] border border-[#38352A] rounded-lg">
                    <span className="text-[10px] font-mono text-[#A79C82]">CD DA SALVAGUARDA DE MAGIA</span>
                    <p className="text-lg font-bold font-mono text-[#DFB56C]">{derived.spellSaveDC}</p>
                  </div>
                  <div className="p-2 bg-[#15140F] border border-[#38352A] rounded-lg">
                    <span className="text-[10px] font-mono text-[#A79C82]">BÔNUS DE ATAQUE MÁGICO</span>
                    <p className="text-lg font-bold font-mono text-[#8DAE8F]">
                      {derived.spellAttackBonus >= 0 ? `+${derived.spellAttackBonus}` : derived.spellAttackBonus}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SKILLS & SAVING THROWS */}
          {activeTab === "skills" && (
            <div className="space-y-6">
              {/* Saving Throws */}
              <div>
                <h4 className="text-xs font-mono text-[#DFB56C] uppercase tracking-wider mb-3">
                  Salvaguardas (Testes de Resistência)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {(
                    [
                      { key: "strength" as const, label: "FOR" },
                      { key: "dexterity" as const, label: "DES" },
                      { key: "constitution" as const, label: "CON" },
                      { key: "intelligence" as const, label: "INT" },
                      { key: "wisdom" as const, label: "SAB" },
                      { key: "charisma" as const, label: "CAR" },
                    ]
                  ).map((s) => {
                    const isProf = !!data.savingThrowProficiencies[s.key];
                    const mod = derived.savingThrows[s.key] || 0;
                    return (
                      <div
                        key={s.key}
                        className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                          isProf ? "bg-[#DFB56C]/10 border-[#DFB56C]/60" : "bg-[#1C1A14] border-[#38352A]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isProf}
                            onChange={() => toggleSaveProf(s.key)}
                            className="accent-[#DFB56C] cursor-pointer"
                          />
                          <span className="text-xs font-mono font-bold text-[#EFE8D8]">{s.label}</span>
                        </div>
                        <button
                          onClick={() => onRollCheck?.(`Salvaguarda de ${s.label}`, mod)}
                          className="font-mono text-sm font-bold text-[#DFB56C] hover:underline"
                        >
                          {mod >= 0 ? `+${mod}` : mod}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Skills List */}
              <div>
                <h4 className="text-xs font-mono text-[#DFB56C] uppercase tracking-wider mb-3">
                  Perícias do Personagem (Clique no quadrado: 1x = Proficiente, 2x = Especialista)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {data.skills.map((sk) => {
                    const mod = derived.skillModifiers[sk.id || sk.name] ?? 0;
                    return (
                      <div
                        key={sk.id || sk.name}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          sk.expertise
                            ? "bg-[#DFB56C]/15 border-[#DFB56C]"
                            : sk.proficient
                            ? "bg-[#25231B] border-[#DFB56C]/50"
                            : "bg-[#1C1A14] border-[#38352A]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => toggleSkillProf(sk.id)}
                            className={`w-4 h-4 rounded border flex items-center justify-center font-mono text-[9px] font-bold shrink-0 ${
                              sk.expertise
                                ? "bg-[#DFB56C] text-[#15140F] border-[#DFB56C]"
                                : sk.proficient
                                ? "bg-[#DFB56C]/40 text-[#DFB56C] border-[#DFB56C]"
                                : "border-[#38352A] text-transparent"
                            }`}
                            title="Alternar Proficiência / Especialização"
                          >
                            {sk.expertise ? "★" : sk.proficient ? "✓" : ""}
                          </button>
                          <span className="text-[#EFE8D8] truncate font-medium">{sk.name}</span>
                          <span className="text-[10px] font-mono text-[#A79C82]">({sk.statKey.toUpperCase()})</span>
                        </div>
                        <button
                          onClick={() => onRollCheck?.(`Perícia: ${sk.name}`, mod)}
                          className="font-mono font-bold text-[#DFB56C] px-2 py-0.5 rounded bg-[#15140F] border border-[#38352A] hover:border-[#DFB56C] transition-colors"
                        >
                          {mod >= 0 ? `+${mod}` : mod}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPELLS */}
          {activeTab === "spells" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#A79C82]">Lista de Magias e Truques Conhecidos</span>
                <button
                  onClick={() => {
                    const newSpell: SpellItem = {
                      id: `sp-${Date.now()}`,
                      name: "Nova Magia",
                      level: 1,
                      school: "Evocação",
                      castingTime: "1 Ação",
                      range: "18m",
                      components: "V, S",
                      duration: "Instantânea",
                      description: "Descreva os efeitos mágicos aqui...",
                      prepared: true,
                      damageOrHealing: "2d8 Fogo",
                    };
                    updateField("spells", [...(data.spells || []), newSpell]);
                  }}
                  className="flex items-center gap-1 text-xs text-[#DFB56C] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar Magia
                </button>
              </div>

              <div className="space-y-2">
                {(data.spells || []).map((sp, idx) => (
                  <div key={sp.id || idx} className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={sp.name}
                        onChange={(e) => {
                          const updated = [...data.spells];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          updateField("spells", updated);
                        }}
                        className="font-serif font-bold text-sm text-[#EFE8D8] bg-transparent border-b border-transparent hover:border-[#DFB56C] outline-none flex-1"
                      />
                      <span className="text-[10px] font-mono text-[#DFB56C] bg-[#DFB56C]/10 px-2 py-0.5 rounded">
                        {sp.level === 0 ? "Truque" : `Círculo ${sp.level}`}
                      </span>
                      <button
                        onClick={() => {
                          updateField(
                            "spells",
                            data.spells.filter((_, i) => i !== idx)
                          );
                        }}
                        className="text-[#A79C82] hover:text-[#C4645A]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <textarea
                      value={sp.description}
                      onChange={(e) => {
                        const updated = [...data.spells];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        updateField("spells", updated);
                      }}
                      rows={2}
                      className="w-full text-xs text-[#A79C82] bg-[#15140F] border border-[#38352A] rounded-lg p-2 outline-none focus:border-[#DFB56C]"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: INVENTORY */}
          {activeTab === "inventory" && (
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
                {["cp", "sp", "ep", "gp", "pp"].map((coin) => (
                  <div key={coin} className="p-2 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                    <span className="text-[10px] text-[#A79C82] uppercase">{coin}</span>
                    <input
                      type="number"
                      value={(data.currency as any)?.[coin] || 0}
                      onChange={(e) => {
                        updateField("currency", {
                          ...data.currency,
                          [coin]: parseInt(e.target.value) || 0,
                        });
                      }}
                      className="w-full text-center font-bold text-[#DFB56C] bg-transparent outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                {(data.inventory || []).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#EFE8D8] truncate">{item.name}</p>
                      <p className="text-[#A79C82] truncate">{item.damageOrAC || item.description || "Item comum"}</p>
                    </div>
                    <span className="font-mono text-[#DFB56C]">x{item.quantity}</span>
                    <button
                      onClick={() => {
                        updateField(
                          "inventory",
                          data.inventory.filter((_, i) => i !== idx)
                        );
                      }}
                      className="text-[#A79C82] hover:text-[#C4645A]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: BUFFS & CONDITIONS */}
          {activeTab === "buffs" && (
            <div className="space-y-4">
              <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl space-y-3">
                <span className="text-xs font-mono text-[#DFB56C] font-bold">ADICIONAR BÔNUS OU CONDIÇÃO TEMPORÁRIA</span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Nome (ex: Escudo Arcano)"
                    value={newBuffName}
                    onChange={(e) => setNewBuffName(e.target.value)}
                    className="bg-[#15140F] border border-[#38352A] rounded-lg px-2.5 py-1 text-xs text-[#EFE8D8] outline-none"
                  />
                  <input
                    type="number"
                    placeholder="+ CA (ex: 5)"
                    value={newBuffAc || ""}
                    onChange={(e) => setNewBuffAc(parseInt(e.target.value) || 0)}
                    className="bg-[#15140F] border border-[#38352A] rounded-lg px-2.5 py-1 text-xs text-[#EFE8D8] outline-none"
                  />
                  <input
                    type="number"
                    placeholder="+ Salvaguarda (ex: 2)"
                    value={newBuffSave || ""}
                    onChange={(e) => setNewBuffSave(parseInt(e.target.value) || 0)}
                    className="bg-[#15140F] border border-[#38352A] rounded-lg px-2.5 py-1 text-xs text-[#EFE8D8] outline-none"
                  />
                  <button
                    onClick={handleAddCondition}
                    className="bg-[#DFB56C] text-[#15140F] font-bold text-xs rounded-lg py-1.5 px-3 hover:bg-[#b08635] transition-colors"
                  >
                    Ativar Efeito
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {(data.activeConditions || []).map((cond) => (
                  <div
                    key={cond.id}
                    className="p-3 bg-[#7A2E27]/20 border border-[#7A2E27] rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#C4645A]" />
                      <span className="text-xs font-bold text-[#EFE8D8]">{cond.name}</span>
                      {cond.acBonus && (
                        <span className="text-[10px] font-mono text-[#8DAE8F] bg-[#4B6B4E]/30 px-1.5 py-0.5 rounded">
                          +{cond.acBonus} CA
                        </span>
                      )}
                      {cond.saveBonus && (
                        <span className="text-[10px] font-mono text-[#DFB56C] bg-[#DFB56C]/20 px-1.5 py-0.5 rounded">
                          +{cond.saveBonus} Salvaguarda
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveCondition(cond.id)}
                      className="text-[#C4645A] hover:text-[#EFE8D8] p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: BIO & TRAITS */}
          {activeTab === "bio" && (
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-[#A79C82] block mb-1">CARACTERÍSTICAS & HABILIDADES ESPECIAIS</label>
                <textarea
                  value={data.featuresAndTraits || ""}
                  onChange={(e) => updateField("featuresAndTraits", e.target.value)}
                  rows={4}
                  className="w-full bg-[#1C1A14] border border-[#38352A] rounded-xl p-2.5 text-[#EFE8D8] outline-none focus:border-[#DFB56C]"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#A79C82] block mb-1">NOTAS DA AVENTURA & LORE</label>
                <textarea
                  value={data.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={4}
                  className="w-full bg-[#1C1A14] border border-[#38352A] rounded-xl p-2.5 text-[#EFE8D8] outline-none focus:border-[#DFB56C]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#12110D] border-t border-[#38352A] flex items-center justify-between text-xs text-[#A79C82]">
          <span className="font-mono text-[10px]">Cálculo automático ativo (D&D 5e / T20)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#DFB56C] text-[#15140F] font-bold rounded-lg hover:bg-[#b08635] transition-colors"
          >
            Concluir Edição
          </button>
        </div>
      </div>
    </div>
  );
};
