import React, { useMemo, useState } from "react";
import {
  X,
  Zap,
  Plus,
  Trash2,
  Play,
  Copy,
  Folder,
  Sword,
  Target,
  Sparkles,
  Eye,
  Dice5,
  Dices,
  HelpCircle,
} from "lucide-react";
import { Macro, MacroCategory, CharacterSheet } from "../../types";
import { executeMacro, resolveMacroVariables } from "../../utils/macroEngine";

interface MacroManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  macros: Macro[];
  onSaveMacros: (macros: Macro[]) => void;
  activeSheet?: CharacterSheet | null;
  onExecuteMacro: (macro: Macro) => void;
  isGm?: boolean;
}

export const MacroManagerModal: React.FC<MacroManagerModalProps> = ({
  isOpen,
  onClose,
  macros,
  onSaveMacros,
  activeSheet,
  onExecuteMacro,
  isGm = false,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingMacro, setEditingMacro] = useState<Macro | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  const categories: MacroCategory[] = ["Ataques", "Magias", "Perícias", "Itens", "Utilidades"];
  const filteredMacros = useMemo(
    () => macros.filter((macro) => selectedCategory === "all" || macro.category === selectedCategory),
    [macros, selectedCategory],
  );

  if (!isOpen) return null;

  const handleCreateNew = () => {
    const newM: Macro = {
      id: `macro-${Date.now()}`,
      name: "Nova Macro de Combate",
      command: "/roll 1d20 + @{strMod} + @{profBonus} [Ataque]\n/damage 1d8 + @{strMod} [Dano]",
      category: "Ataques",
      creatorId: activeSheet?.ownerId || "gm",
      creatorName: activeSheet?.name || "Mestre",
      isShared: false,
      createdAt: Date.now(),
    };
    setEditingMacro(newM);
    setTestResult(null);
  };

  const handleSaveEdit = () => {
    if (!editingMacro || !editingMacro.name.trim()) return;
    const exists = macros.some((m) => m.id === editingMacro.id);
    let updated: Macro[];
    if (exists) {
      updated = macros.map((m) => (m.id === editingMacro.id ? editingMacro : m));
    } else {
      updated = [editingMacro, ...macros];
    }
    onSaveMacros(updated);
    setEditingMacro(null);
    setTestResult(null);
  };

  const handleDelete = (id: string) => {
    const updated = macros.filter((m) => m.id !== id);
    onSaveMacros(updated);
    if (editingMacro?.id === id) setEditingMacro(null);
  };

  const handleTestRun = (macroToTest: Macro) => {
    const result = executeMacro(macroToTest, activeSheet);
    setTestResult(
      `Comando Resolvido: ${result.resolvedCommand}\nResultado: ${result.finalTotal} (${result.diceRolls.map((d) => d.formula + " = " + d.total).join(", ")})`
    );
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Gerenciador de macros" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="bg-[#15140F] border border-[#7A2E27]/50 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#1C1A14] border-b border-[#38352A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7A2E27]/30 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C]">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#EFE8D8] flex items-center gap-2">
                <span>Gerenciador de Macros de Rolagem</span>
                {activeSheet && (
                  <span className="text-xs font-mono text-[#8DAE8F] bg-[#4B6B4E]/30 px-2 py-0.5 rounded">
                    Vinculado: {activeSheet.name}
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#A79C82]">
                Crie botões de rolagem com fórmulas avançadas e variáveis automáticas da ficha
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar gerenciador de macros"
            title="Fechar"
            className="p-2 text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#25231B] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Categories & Macro List */}
          <div className="w-full md:w-80 border-r border-[#38352A] bg-[#12110D] flex flex-col overflow-hidden shrink-0">
            {/* Category Filter */}
            <div className="p-3 border-b border-[#38352A] flex items-center justify-between">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#1C1A14] border border-[#38352A] rounded-lg px-2.5 py-1 text-xs text-[#EFE8D8] outline-none"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <button
                onClick={handleCreateNew}
                className="flex items-center gap-1 px-2.5 py-1 bg-[#DFB56C] hover:bg-[#b08635] text-[#15140F] font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Nova
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredMacros.map((m) => (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                    editingMacro?.id === m.id
                      ? "bg-[#DFB56C]/15 border-[#DFB56C]"
                      : "bg-[#1C1A14] border-[#38352A] hover:border-[#DFB56C]/40"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMacro(m);
                      setTestResult(null);
                    }}
                    className="flex-1 min-w-0 cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#EFE8D8] truncate">{m.name}</span>
                      {m.isShared && (
                        <span className="text-[9px] font-mono text-[#8DAE8F] bg-[#4B6B4E]/30 px-1 rounded">GM</span>
                      )}
                    </div>
                    <p className="text-[10px] font-mono text-[#A79C82] truncate">{m.command.split("\n")[0]}</p>
                  </button>

                  <button
                    onClick={() => onExecuteMacro(m)}
                    className="p-1.5 bg-[#7A2E27]/40 hover:bg-[#7A2E27] text-[#DFB56C] hover:text-[#EFE8D8] rounded-lg transition-colors cursor-pointer"
                    title="Rolar agora e enviar ao Chat"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Editor & Preview */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#181611] flex flex-col justify-between space-y-4">
            {editingMacro ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-mono font-bold text-[#DFB56C] uppercase tracking-wider">
                    Editar Configuração da Macro
                  </h3>
                  <button
                    onClick={() => handleDelete(editingMacro.id)}
                    className="flex items-center gap-1 text-xs text-[#C4645A] hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir Macro
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="macro-name" className="text-[10px] font-mono text-[#A79C82] block mb-1">NOME DA MACRO</label>
                    <input
                      id="macro-name"
                      type="text"
                      value={editingMacro.name}
                      onChange={(e) => setEditingMacro({ ...editingMacro, name: e.target.value })}
                      className="w-full bg-[#1C1A14] border border-[#38352A] rounded-xl px-3 py-1.5 text-xs text-[#EFE8D8] outline-none focus:border-[#DFB56C]"
                    />
                  </div>

                  <div>
                    <label htmlFor="macro-category" className="text-[10px] font-mono text-[#A79C82] block mb-1">CATEGORIA</label>
                    <select
                      id="macro-category"
                      value={editingMacro.category}
                      onChange={(e) => setEditingMacro({ ...editingMacro, category: e.target.value as MacroCategory })}
                      className="w-full bg-[#1C1A14] border border-[#38352A] rounded-xl px-3 py-1.5 text-xs text-[#EFE8D8] outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="macro-command" className="text-[10px] font-mono text-[#A79C82]">FÓRMULA / COMANDOS DE DADOS</label>
                    <span className="text-[10px] font-mono text-[#8DAE8F]">
                      Suporta: /roll, /damage, 1d20+@{`{strMod}`}, [Rótulo]
                    </span>
                  </div>
                  <textarea
                    id="macro-command"
                    rows={4}
                    value={editingMacro.command}
                    onChange={(e) => setEditingMacro({ ...editingMacro, command: e.target.value })}
                    className="w-full font-mono text-xs bg-[#1C1A14] border border-[#38352A] rounded-xl p-3 text-[#DFB56C] outline-none focus:border-[#DFB56C]"
                  />
                </div>

                {/* Variable Help Dropdown */}
                <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-[#A79C82] block">
                    VARIÁVEIS AUTOMÁTICAS DISPONÍVEIS DA FICHA ATIVA:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                    {[
                      "@{strMod}",
                      "@{dexMod}",
                      "@{conMod}",
                      "@{intMod}",
                      "@{wisMod}",
                      "@{chaMod}",
                      "@{profBonus}",
                      "@{ac}",
                      "@{initiative}",
                      "@{skill.percepção}",
                      "@{skill.atletismo}",
                      "@{level}",
                    ].map((v) => (
                      <button
                        key={v}
                        onClick={() =>
                          setEditingMacro({
                            ...editingMacro,
                            command: editingMacro.command + " " + v,
                          })
                        }
                        className="px-2 py-0.5 bg-[#25231B] hover:bg-[#DFB56C]/20 border border-[#38352A] hover:border-[#DFB56C] text-[#DFB56C] rounded transition-colors"
                      >
                        + {v}
                      </button>
                    ))}
                  </div>
                </div>

                {isGm && (
                  <label className="flex items-center gap-2 text-xs text-[#EFE8D8] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingMacro.isShared}
                      onChange={(e) => setEditingMacro({ ...editingMacro, isShared: e.target.checked })}
                      className="accent-[#DFB56C]"
                    />
                    <span>Macro Compartilhada (disponível para todos os jogadores da campanha)</span>
                  </label>
                )}

                {/* Test Result box */}
                {testResult && (
                  <div className="p-3 bg-[#15140F] border border-[#8DAE8F]/40 rounded-xl text-xs font-mono text-[#8DAE8F] whitespace-pre-wrap">
                    {testResult}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#A79C82] space-y-2">
                <Dices className="w-12 h-12 text-[#38352A]" />
                <p className="text-sm font-serif text-[#EFE8D8]">Selecione uma macro ou crie uma nova para editar</p>
                <p className="text-xs max-w-sm">
                  As macros facilitam ataques e testes durante o jogo com um único clique.
                </p>
              </div>
            )}

            {editingMacro && (
              <div className="flex items-center justify-between pt-4 border-t border-[#38352A]">
                <button
                  onClick={() => handleTestRun(editingMacro)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25231B] hover:bg-[#322f24] border border-[#38352A] text-xs font-mono text-[#DFB56C] rounded-xl transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Testar Rolagem</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingMacro(null)}
                    className="px-3 py-1.5 text-xs text-[#A79C82] hover:text-[#EFE8D8]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-1.5 bg-[#DFB56C] text-[#15140F] font-bold text-xs rounded-xl hover:bg-[#b08635] transition-colors"
                  >
                    Salvar Macro
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
