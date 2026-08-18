import React, { useState } from "react";
import {
  X,
  Skull,
  Search,
  Shield,
  Heart,
  Zap,
  Swords,
  Copy,
  Plus,
  Trash2,
  Dice5,
  Sparkles,
  MapPin,
} from "lucide-react";
import { MonsterStatBlock } from "../../types";
import { DEFAULT_MONSTERS } from "../../data/defaultMonsters";

interface BestiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  monsters: MonsterStatBlock[];
  onSaveMonsters: (monsters: MonsterStatBlock[]) => void;
  onSpawnToMap?: (monster: MonsterStatBlock) => void;
  onRollAction?: (actionName: string, bonus: number, damageDice?: string) => void;
}

export const BestiaryModal: React.FC<BestiaryModalProps> = ({
  isOpen,
  onClose,
  monsters,
  onSaveMonsters,
  onSpawnToMap,
  onRollAction,
}) => {
  const [allMonsters, setAllMonsters] = useState<MonsterStatBlock[]>(() => {
    if (monsters && monsters.length > 0) return monsters;
    return DEFAULT_MONSTERS;
  });
  const [selectedMonster, setSelectedMonster] = useState<MonsterStatBlock>(allMonsters[0] || DEFAULT_MONSTERS[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCr, setSelectedCr] = useState<string>("all");

  if (!isOpen) return null;

  const filteredMonsters = allMonsters.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.creatureType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || m.creatureType.toLowerCase().includes(selectedType.toLowerCase());
    const matchesCr =
      selectedCr === "all" ||
      (selectedCr === "low" && ["1/8", "1/4", "1/2", "1"].includes(m.challengeRating)) ||
      (selectedCr === "mid" && ["2", "3", "4", "5"].includes(m.challengeRating)) ||
      (selectedCr === "high" && parseInt(m.challengeRating, 10) >= 6);

    return matchesSearch && matchesType && matchesCr;
  });

  const handleDuplicate = (monster: MonsterStatBlock) => {
    const duplicated: MonsterStatBlock = {
      ...monster,
      id: `custom-mon-${Date.now()}`,
      name: `${monster.name} (Customizado)`,
      isCustom: true,
    };
    const updated = [duplicated, ...allMonsters];
    setAllMonsters(updated);
    setSelectedMonster(duplicated);
    onSaveMonsters(updated);
  };

  const handleDelete = (id: string) => {
    const updated = allMonsters.filter((m) => m.id !== id);
    setAllMonsters(updated);
    if (selectedMonster.id === id && updated.length > 0) {
      setSelectedMonster(updated[0]);
    }
    onSaveMonsters(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="bg-[#15140F] border border-[#7A2E27]/50 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#1C1A14] border-b border-[#38352A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7A2E27]/30 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C]">
              <Skull className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#EFE8D8] flex items-center gap-2">
                <span>Bestiário & Fichas de Monstros</span>
                <span className="text-xs font-mono text-[#8DAE8F] bg-[#4B6B4E]/30 px-2 py-0.5 rounded">
                  {allMonsters.length} Criaturas
                </span>
              </h2>
              <p className="text-xs text-[#A79C82]">
                Biblioteca completa com blocos de estatísticas, ações rápidas e spawn para o grid
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#25231B] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body: Left sidebar (list + filters) and Right side (statblock) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Search, Filters & Monster List */}
          <div className="w-full md:w-80 border-r border-[#38352A] bg-[#12110D] flex flex-col overflow-hidden shrink-0">
            <div className="p-3 border-b border-[#38352A] space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#A79C82]" />
                <input
                  type="text"
                  placeholder="Buscar monstro por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1C1A14] border border-[#38352A] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#EFE8D8] placeholder-[#A79C82] outline-none focus:border-[#DFB56C]"
                />
              </div>

              {/* Filter pills */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <select
                  value={selectedCr}
                  onChange={(e) => setSelectedCr(e.target.value)}
                  className="bg-[#1C1A14] border border-[#38352A] rounded-lg px-2 py-1 text-[#A79C82] outline-none"
                >
                  <option value="all">Todos os Níveis (ND)</option>
                  <option value="low">ND 0 a 1 (Baixo)</option>
                  <option value="mid">ND 2 a 5 (Médio)</option>
                  <option value="high">ND 6+ (Alto / Épico)</option>
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-[#1C1A14] border border-[#38352A] rounded-lg px-2 py-1 text-[#A79C82] outline-none"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="humanoide">Humanoides</option>
                  <option value="morto-vivo">Mortos-vivos</option>
                  <option value="dragão">Dragões</option>
                  <option value="gigante">Gigantes</option>
                  <option value="aberração">Aberrações</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredMonsters.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMonster(m)}
                  className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between transition-colors ${
                    selectedMonster?.id === m.id
                      ? "bg-[#DFB56C]/15 border-[#DFB56C] text-[#EFE8D8]"
                      : "bg-[#1C1A14] border-[#38352A] text-[#A79C82] hover:border-[#DFB56C]/40 hover:text-[#EFE8D8]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-serif font-bold text-xs truncate text-[#EFE8D8]">{m.name}</p>
                    <p className="text-[10px] text-[#A79C82] truncate">{m.creatureType}</p>
                  </div>
                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span className="text-[10px] font-mono font-bold text-[#DFB56C]">ND {m.challengeRating}</span>
                    <span className="text-[9px] font-mono text-[#C4645A]">{m.hp.average} PV</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Full StatBlock */}
          {selectedMonster && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#181611] space-y-4">
              {/* Statblock Header */}
              <div className="p-4 bg-[#1C1A14] border border-[#7A2E27]/50 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#DFB56C]">{selectedMonster.name}</h3>
                  <p className="text-xs text-[#A79C82] italic">
                    {selectedMonster.size} {selectedMonster.creatureType}, {selectedMonster.alignment}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDuplicate(selectedMonster)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] text-xs text-[#EFE8D8] rounded-xl transition-colors cursor-pointer"
                    title="Duplicar monstro para editar"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#DFB56C]" />
                    <span>Duplicar & Customizar</span>
                  </button>

                  {onSpawnToMap && (
                    <button
                      onClick={() => onSpawnToMap(selectedMonster)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#7A2E27] hover:bg-[#8F352E] text-xs font-bold text-[#EFE8D8] rounded-xl transition-colors cursor-pointer"
                      title="Adicionar monstro como Token no Mapa Interativo"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#DFB56C]" />
                      <span>Enviar ao Mapa</span>
                    </button>
                  )}

                  {selectedMonster.isCustom && (
                    <button
                      onClick={() => handleDelete(selectedMonster.id)}
                      className="p-2 text-[#C4645A] hover:bg-[#7A2E27]/20 rounded-xl"
                      title="Excluir este monstro customizado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Basic AC, HP, Speed */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                  <span className="text-[#A79C82] block text-[10px]">CLASSE DE ARMADURA</span>
                  <span className="text-base font-bold text-[#DFB56C]">
                    {selectedMonster.armorClass} {selectedMonster.armorType && `(${selectedMonster.armorType})`}
                  </span>
                </div>
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                  <span className="text-[#A79C82] block text-[10px]">PONTOS DE VIDA</span>
                  <span className="text-base font-bold text-[#C4645A]">
                    {selectedMonster.hp.average} ({selectedMonster.hp.formula})
                  </span>
                </div>
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                  <span className="text-[#A79C82] block text-[10px]">DESLOCAMENTO</span>
                  <span className="text-base font-bold text-[#EFE8D8]">{selectedMonster.speed}</span>
                </div>
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                  <span className="text-[#A79C82] block text-[10px]">DESAFIO (ND & XP)</span>
                  <span className="text-base font-bold text-[#8DAE8F]">
                    ND {selectedMonster.challengeRating} ({selectedMonster.xp} XP)
                  </span>
                </div>
              </div>

              {/* 6 Stats Bar */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                {[
                  { label: "FOR", val: selectedMonster.stats.strength },
                  { label: "DES", val: selectedMonster.stats.dexterity },
                  { label: "CON", val: selectedMonster.stats.constitution },
                  { label: "INT", val: selectedMonster.stats.intelligence },
                  { label: "SAB", val: selectedMonster.stats.wisdom },
                  { label: "CAR", val: selectedMonster.stats.charisma },
                ].map((st) => {
                  const mod = Math.floor((st.val - 10) / 2);
                  return (
                    <div key={st.label} className="p-2 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                      <span className="text-[10px] font-mono text-[#A79C82]">{st.label}</span>
                      <p className="text-sm font-bold font-mono text-[#EFE8D8]">
                        {st.val} ({mod >= 0 ? `+${mod}` : mod})
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Traits & Senses */}
              <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl text-xs space-y-1.5 text-[#A79C82]">
                {selectedMonster.savingThrows && (
                  <p>
                    <strong className="text-[#EFE8D8]">Salvaguardas:</strong> {selectedMonster.savingThrows}
                  </p>
                )}
                {selectedMonster.skills && (
                  <p>
                    <strong className="text-[#EFE8D8]">Perícias:</strong> {selectedMonster.skills}
                  </p>
                )}
                {selectedMonster.damageImmunities && (
                  <p>
                    <strong className="text-[#EFE8D8]">Imunidades a Dano:</strong> {selectedMonster.damageImmunities}
                  </p>
                )}
                {selectedMonster.conditionImmunities && (
                  <p>
                    <strong className="text-[#EFE8D8]">Imunidades a Condição:</strong> {selectedMonster.conditionImmunities}
                  </p>
                )}
                <p>
                  <strong className="text-[#EFE8D8]">Sentidos:</strong> {selectedMonster.senses}
                </p>
                <p>
                  <strong className="text-[#EFE8D8]">Idiomas:</strong> {selectedMonster.languages}
                </p>
              </div>

              {/* Special Traits */}
              {(selectedMonster.traits || []).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-[#DFB56C] uppercase tracking-wider">Habilidades Especiais</h4>
                  {selectedMonster.traits.map((tr, i) => (
                    <div key={i} className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl text-xs">
                      <strong className="text-[#EFE8D8] font-serif">{tr.name}.</strong>{" "}
                      <span className="text-[#A79C82]">{tr.description}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions List with Auto-Roll */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold text-[#DFB56C] uppercase tracking-wider">Ações de Combate</h4>
                {selectedMonster.actions.map((act, i) => (
                  <div key={i} className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <strong className="text-[#EFE8D8] font-serif text-sm">{act.name}</strong>
                      {act.attackBonus !== undefined && (
                        <button
                          onClick={() => onRollAction?.(act.name, act.attackBonus || 0, act.damageDice)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-[#7A2E27]/30 hover:bg-[#7A2E27] border border-[#7A2E27] text-[#DFB56C] hover:text-[#EFE8D8] rounded-lg transition-colors font-mono font-bold text-xs cursor-pointer"
                        >
                          <Dice5 className="w-3.5 h-3.5" />
                          <span>Rolar Ataque (+{act.attackBonus})</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[#A79C82]">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
