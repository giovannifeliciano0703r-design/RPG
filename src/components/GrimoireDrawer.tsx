import React, { useState } from "react";
import { BookMarked, X, Search, Trash2, Download, FileText, Sparkles, Filter } from "lucide-react";
import { ParsedRpgCard } from "../types";
import { RpgCard } from "./RpgCard";

interface GrimoireDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedCards: ParsedRpgCard[];
  onRemoveCard: (cardId: string) => void;
  onClearAll: () => void;
  onAskFollowUp: (prompt: string) => void;
  onOpenDice?: () => void;
}

export const GrimoireDrawer: React.FC<GrimoireDrawerProps> = ({
  isOpen,
  onClose,
  savedCards,
  onRemoveCard,
  onClearAll,
  onAskFollowUp,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSystem, setSelectedSystem] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  if (!isOpen) return null;

  // Extract unique systems and categories from saved cards
  const systems = Array.from(new Set(savedCards.map((c) => c.systemEd).filter(Boolean)));
  const categories = Array.from(new Set(savedCards.map((c) => c.category).filter(Boolean)));

  const filteredCards = savedCards.filter((card) => {
    const matchesSearch =
      card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (card.category && card.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSystem = selectedSystem === "all" || card.systemEd === selectedSystem;
    const matchesCategory = selectedCategory === "all" || card.category === selectedCategory;

    return matchesSearch && matchesSystem && matchesCategory;
  });

  const exportAsMarkdown = () => {
    if (savedCards.length === 0) return;
    const content = savedCards
      .map(
        (c) =>
          `# ${c.name} — ${c.systemEd || "RPG"}\n\n- **Categoria**: ${c.category}\n- **Descrição**: ${
            c.description
          }\n- **Atributos/Requisitos**: ${c.attributes || "Nenhum"}\n- **Habilidades/Efeitos**: \n${c.abilities
            .map((a) => `  - ${a}`)
            .join("\n")}\n- **Vantagens**: \n${c.advantages
            .map((a) => `  - ${a}`)
            .join("\n")}\n- **Desvantagens**: \n${c.disadvantages
            .map((d) => `  - ${d}`)
            .join("\n")}\n- **Fonte**: ${c.source}\n- **Confiança**: ${c.confidence}\n\n---\n`
      )
      .join("\n");

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Grimorio_Mestre_Arcano_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJson = () => {
    if (savedCards.length === 0) return;
    const blob = new Blob([JSON.stringify(savedCards, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Grimorio_Mestre_Arcano_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full sm:max-w-xl md:max-w-2xl bg-[#1D1B14] border-l border-[#38352A] h-full shadow-2xl flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#38352A] bg-[#15140F] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#B08635]/15 border border-[#B08635]/40 flex items-center justify-center text-[#DFB56C]">
              <BookMarked className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-[#EFE8D8]">Grimório de Fichas</h2>
              <p className="text-[11px] sm:text-xs font-mono text-[#A79C82]">
                {savedCards.length} {savedCards.length === 1 ? "elemento arquivado" : "elementos arquivados"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {savedCards.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={exportAsMarkdown}
                  title="Exportar Markdown"
                  className="px-2 py-1.5 bg-[#15140F] hover:bg-[#38352A] text-[#EFE8D8] text-xs font-mono rounded border border-[#38352A] flex items-center gap-1 transition-colors active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5 text-[#8DAE8F]" />
                  <span className="hidden sm:inline">.MD</span>
                </button>
                <button
                  onClick={exportAsJson}
                  title="Exportar JSON"
                  className="px-2 py-1.5 bg-[#15140F] hover:bg-[#38352A] text-[#EFE8D8] text-xs font-mono rounded border border-[#38352A] flex items-center gap-1 transition-colors active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-[#DFB56C]" />
                  <span className="hidden sm:inline">.JSON</span>
                </button>
                <button
                  onClick={onClearAll}
                  title="Limpar Todo o Grimório"
                  className="p-2 hover:bg-[#7A2E27]/20 text-[#C4645A] rounded border border-transparent hover:border-[#7A2E27] transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#38352A] rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        {savedCards.length > 0 && (
          <div className="p-4 border-b border-[#38352A] bg-[#181610] space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A79C82]" />
              <input
                type="text"
                placeholder="Buscar no grimório por nome, categoria ou termo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#15140F] border border-[#38352A] rounded-lg pl-9 pr-4 py-2 text-sm text-[#EFE8D8] placeholder-[#A79C82] focus:border-[#8DAE8F] focus:outline-none font-sans"
              />
            </div>

            {/* Filter Tags */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-mono text-[#A79C82] flex items-center gap-1">
                <Filter className="w-3 h-3" /> Sistema:
              </span>
              <button
                onClick={() => setSelectedSystem("all")}
                className={`px-2 py-0.5 rounded font-mono ${
                  selectedSystem === "all"
                    ? "bg-[#4B6B4E] text-[#E9F1E9]"
                    : "bg-[#15140F] text-[#A79C82] border border-[#38352A]"
                }`}
              >
                Todos
              </button>
              {systems.map((sys) => (
                <button
                  key={sys}
                  onClick={() => setSelectedSystem(sys)}
                  className={`px-2 py-0.5 rounded font-mono ${
                    selectedSystem === sys
                      ? "bg-[#4B6B4E] text-[#E9F1E9]"
                      : "bg-[#15140F] text-[#A79C82] border border-[#38352A]"
                  }`}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card List Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {savedCards.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-[#A79C82]">
              <Sparkles className="w-12 h-12 text-[#38352A] mb-3" />
              <h3 className="font-serif text-lg font-medium text-[#EFE8D8] mb-1">Seu Grimório está vazio</h3>
              <p className="text-sm max-w-sm">
                Ao consultar classes, magias, itens ou mecânicas, clique no ícone de marcador para salvar a ficha
                aqui para acesso rápido durante suas sessões de RPG.
              </p>
            </div>
          ) : filteredCards.length === 0 ? (
            <div className="text-center py-12 text-[#A79C82]">
              <p className="text-sm">Nenhuma ficha corresponde aos filtros selecionados.</p>
            </div>
          ) : (
            filteredCards.map((card) => (
              <div key={card.id} className="relative">
                <RpgCard
                  card={card}
                  isBookmarked={true}
                  onToggleBookmark={() => onRemoveCard(card.id)}
                  onAskFollowUp={onAskFollowUp}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
