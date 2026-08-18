import React, { useState, useEffect } from "react";
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
  Flame,
  BookOpen,
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

const SYSTEM_COLORS: Record<string, { badge: string; text: string }> = {
  "Dungeons & Dragons (D&D)": { badge: "bg-[#DFB56C]/15 border-[#DFB56C]/40 text-[#DFB56C]", text: "D&D 5e" },
  "D&D 5e": { badge: "bg-[#DFB56C]/15 border-[#DFB56C]/40 text-[#DFB56C]", text: "D&D 5e" },
  "Pathfinder": { badge: "bg-[#7E9FB0]/15 border-[#7E9FB0]/40 text-[#7E9FB0]", text: "PF 2e" },
  "Tormenta20 (T20)": { badge: "bg-[#C4645A]/15 border-[#C4645A]/40 text-[#C4645A]", text: "T20" },
  "Call of Cthulhu": { badge: "bg-[#8DAE8F]/15 border-[#8DAE8F]/40 text-[#8DAE8F]", text: "CoC 7e" },
  "Vampiro: A Máscara (Storyteller)": { badge: "bg-[#9E4B55]/15 border-[#9E4B55]/40 text-[#9E4B55]", text: "VTM V5" },
  "Cyberpunk Red": { badge: "bg-[#D94F5C]/15 border-[#D94F5C]/40 text-[#D94F5C]", text: "CP RED" },
  "Savage Worlds": { badge: "bg-[#DF8050]/15 border-[#DF8050]/40 text-[#DF8050]", text: "SWADE" },
  "GURPS": { badge: "bg-[#6BA396]/15 border-[#6BA396]/40 text-[#6BA396]", text: "GURPS" },
  "Old Dragon": { badge: "bg-[#E5A84B]/15 border-[#E5A84B]/40 text-[#E5A84B]", text: "OD 2e" },
  "Fate Core": { badge: "bg-[#987CB8]/15 border-[#987CB8]/40 text-[#987CB8]", text: "FATE" },
  "Outro / não especificar": { badge: "bg-[#D6CEBE]/15 border-[#D6CEBE]/40 text-[#D6CEBE]", text: "Especial" },
};

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

  useEffect(() => {
    if (monsters && monsters.length > 0) {
      setAllMonsters(monsters);
    }
  }, [monsters]);

  const [selectedMonster, setSelectedMonster] = useState<MonsterStatBlock>(allMonsters[0] || DEFAULT_MONSTERS[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedCr, setSelectedCr] = useState<string>("all");

  if (!isOpen) return null;

  const filteredMonsters = allMonsters.filter((m) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(term) ||
      m.creatureType.toLowerCase().includes(term) ||
      (m.system && m.system.toLowerCase().includes(term));

    const matchesSystem =
      selectedSystem === "all" ||
      (m.system && m.system.toLowerCase().includes(selectedSystem.toLowerCase()));

    const matchesType =
      selectedType === "all" || m.creatureType.toLowerCase().includes(selectedType.toLowerCase());

    const matchesCr =
      selectedCr === "all" ||
      (selectedCr === "low" && ["1/8", "1/4", "1/2", "1"].includes(m.challengeRating)) ||
      (selectedCr === "mid" && ["2", "3", "4", "5"].includes(m.challengeRating)) ||
      (selectedCr === "high" && parseInt(m.challengeRating, 10) >= 6);

    return matchesSearch && matchesSystem && matchesType && matchesCr;
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
                Estatísticas oficiais, fichas completas, rolagem de dados e envio direto para o Grid tático
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#25231B] rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body: Left sidebar (list + filters) and Right side (statblock) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Search, Filters & Monster List */}
          <div className="w-full md:w-88 border-r border-[#38352A] bg-[#12110D] flex flex-col overflow-hidden shrink-0">
            <div className="p-3 border-b border-[#38352A] space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#A79C82]" />
                <input
                  type="text"
                  placeholder="Buscar por monstro, sistema ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1C1A14] border border-[#38352A] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#EFE8D8] placeholder-[#A79C82] outline-none focus:border-[#DFB56C]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-2 text-[10px] text-[#A79C82] hover:text-[#EFE8D8]"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Filter Row 1: System */}
              <div className="text-[11px] font-mono">
                <select
                  value={selectedSystem}
                  onChange={(e) => setSelectedSystem(e.target.value)}
                  className="w-full bg-[#1C1A14] border border-[#38352A] rounded-lg px-2 py-1.5 text-[#DFB56C] outline-none"
                >
                  <option value="all">⚡ Todos os Sistemas de RPG</option>
                  <option value="Dungeons & Dragons">D&D 5ª Edição</option>
                  <option value="Pathfinder">Pathfinder 2e</option>
                  <option value="Tormenta20">Tormenta20 (T20)</option>
                  <option value="Call of Cthulhu">Call of Cthulhu (CoC 7e)</option>
                  <option value="Vampiro">Vampiro: A Máscara (V5)</option>
                  <option value="Cyberpunk">Cyberpunk RED</option>
                  <option value="Savage Worlds">Savage Worlds (SWADE)</option>
                  <option value="GURPS">GURPS 4ª Edição</option>
                  <option value="Outro">Outros / Sci-Fi / Paranormal</option>
                </select>
              </div>

              {/* Filter Row 2: Level (ND) & Creature Type */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <select
                  value={selectedCr}
                  onChange={(e) => setSelectedCr(e.target.value)}
                  className="bg-[#1C1A14] border border-[#38352A] rounded-lg px-2 py-1 text-[#A79C82] outline-none"
                >
                  <option value="all">ND / Desafio</option>
                  <option value="low">ND 0 a 1 (Inicial)</option>
                  <option value="mid">ND 2 a 5 (Médio)</option>
                  <option value="high">ND 6+ (Alto / Chefe)</option>
                </select>

                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="bg-[#1C1A14] border border-[#38352A] rounded-lg px-2 py-1 text-[#A79C82] outline-none"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="morto-vivo">Morto-vivo</option>
                  <option value="humanoide">Humanoide / Réptil</option>
                  <option value="constructo">Constructo / Robô</option>
                  <option value="monstruosidade">Monstruosidade</option>
                  <option value="dragão">Dragão</option>
                  <option value="gigante">Gigante</option>
                  <option value="aberração">Aberração</option>
                  <option value="vampiro">Vampiro</option>
                </select>
              </div>
            </div>

            {/* Monsters List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredMonsters.map((m) => {
                const sysInfo = SYSTEM_COLORS[m.system] || {
                  badge: "bg-[#DFB56C]/10 border-[#DFB56C]/30 text-[#DFB56C]",
                  text: m.system?.split(" ")[0] || "RPG",
                };
                const isSelected = selectedMonster?.id === m.id;

                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMonster(m)}
                    className={`w-full p-2.5 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#DFB56C]/15 border-[#DFB56C] text-[#EFE8D8] shadow-sm ring-1 ring-[#DFB56C]/30"
                        : "bg-[#1C1A14] border-[#38352A] text-[#A79C82] hover:border-[#DFB56C]/40 hover:text-[#EFE8D8]"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${sysInfo.badge}`}>
                          {sysInfo.text}
                        </span>
                        <p className="font-serif font-bold text-xs truncate text-[#EFE8D8]">{m.name}</p>
                      </div>
                      <p className="text-[10px] text-[#A79C82] truncate">{m.creatureType}</p>
                    </div>

                    <div className="flex flex-col items-end shrink-0 pl-1">
                      <span className="text-[10px] font-mono font-bold text-[#DFB56C]">ND {m.challengeRating}</span>
                      <span className="text-[9px] font-mono text-[#C4645A]">{m.hp.average} PV</span>
                    </div>
                  </button>
                );
              })}

              {filteredMonsters.length === 0 && (
                <div className="p-6 text-center text-[#8A8270] text-xs">
                  Nenhum monstro encontrado com os filtros selecionados.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Full StatBlock */}
          {selectedMonster ? (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#181611] space-y-4">
              {/* Statblock Header */}
              <div className="p-4 bg-[#1C1A14] border border-[#7A2E27]/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        SYSTEM_COLORS[selectedMonster.system]?.badge || "bg-[#DFB56C]/10 border-[#DFB56C]/30 text-[#DFB56C]"
                      }`}
                    >
                      {selectedMonster.system}
                    </span>
                    {selectedMonster.isCustom && (
                      <span className="text-[10px] font-mono text-[#8DAE8F] bg-[#4B6B4E]/30 px-2 py-0.5 rounded">
                        Customizado
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#DFB56C]">{selectedMonster.name}</h3>
                  <p className="text-xs text-[#A79C82] italic">
                    {selectedMonster.size} {selectedMonster.creatureType}, {selectedMonster.alignment}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleDuplicate(selectedMonster)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] text-xs text-[#EFE8D8] rounded-xl transition-colors cursor-pointer"
                    title="Duplicar monstro para editar"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#DFB56C]" />
                    <span>Duplicar</span>
                  </button>

                  {onSpawnToMap && (
                    <button
                      onClick={() => onSpawnToMap(selectedMonster)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#7A2E27] hover:bg-[#8F352E] text-xs font-bold text-[#EFE8D8] rounded-xl transition-colors cursor-pointer shadow-md"
                      title="Adicionar monstro como Token no Mapa Interativo"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#DFB56C]" />
                      <span>Enviar ao Mapa</span>
                    </button>
                  )}

                  {selectedMonster.isCustom && (
                    <button
                      onClick={() => handleDelete(selectedMonster.id)}
                      className="p-2 text-[#C4645A] hover:bg-[#7A2E27]/20 rounded-xl cursor-pointer"
                      title="Excluir este monstro customizado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Basic AC, HP, Speed, Challenge */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                  <span className="text-[#A79C82] block text-[10px]">DEFESA / CA</span>
                  <span className="text-base font-bold text-[#DFB56C]">
                    {selectedMonster.armorClass} {selectedMonster.armorType && `(${selectedMonster.armorType})`}
                  </span>
                </div>
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                  <span className="text-[#A79C82] block text-[10px]">PONTOS DE VIDA</span>
                  <span className="text-base font-bold text-[#C4645A]">
                    {selectedMonster.hp.average} PV
                  </span>
                  <span className="text-[10px] text-[#8A8270] block truncate">
                    {selectedMonster.hp.formula}
                  </span>
                </div>
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                  <span className="text-[#A79C82] block text-[10px]">DESLOCAMENTO</span>
                  <span className="text-base font-bold text-[#EFE8D8]">{selectedMonster.speed}</span>
                </div>
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl">
                  <span className="text-[#A79C82] block text-[10px]">DESAFIO / ND</span>
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

              {/* Traits, Defenses & Senses */}
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
                {selectedMonster.damageResistances && (
                  <p>
                    <strong className="text-[#DFB56C]">Resistências a Dano:</strong> {selectedMonster.damageResistances}
                  </p>
                )}
                {selectedMonster.damageVulnerabilities && (
                  <p>
                    <strong className="text-[#C4645A]">Vulnerabilidades:</strong> {selectedMonster.damageVulnerabilities}
                  </p>
                )}
                {selectedMonster.damageImmunities && (
                  <p>
                    <strong className="text-[#8DAE8F]">Imunidades a Dano:</strong> {selectedMonster.damageImmunities}
                  </p>
                )}
                {selectedMonster.conditionImmunities && (
                  <p>
                    <strong className="text-[#8DAE8F]">Imunidades a Condição:</strong> {selectedMonster.conditionImmunities}
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
                <h4 className="text-xs font-mono font-bold text-[#DFB56C] uppercase tracking-wider">Ações de Combate & Ataques</h4>
                {selectedMonster.actions.map((act, i) => (
                  <div key={i} className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <strong className="text-[#EFE8D8] font-serif text-sm">{act.name}</strong>
                        {act.damageType && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#25231B] text-[#A79C82]">
                            {act.damageType}
                          </span>
                        )}
                      </div>
                      {act.attackBonus !== undefined && (
                        <button
                          onClick={() => onRollAction?.(act.name, act.attackBonus || 0, act.damageDice)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-[#7A2E27]/40 hover:bg-[#7A2E27] border border-[#7A2E27] text-[#DFB56C] hover:text-[#EFE8D8] rounded-lg transition-colors font-mono font-bold text-xs cursor-pointer shadow-xs"
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
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#8A8270] text-sm">
              Selecione um monstro para visualizar a ficha completa.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
