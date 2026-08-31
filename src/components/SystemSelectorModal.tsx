import React, { useState } from "react";
import { X, Search, Check, Sparkles, BookOpen, Shield, Dices, ArrowRight } from "lucide-react";
import { RpgSystem } from "../types";

export interface SystemMeta {
  id: RpgSystem;
  abbrev: string;
  shortName: string;
  fullName: string;
  genre: string;
  diceSystem: string;
  icon: string;
  description: string;
  themeColor: string;
  badgeBg: string;
  borderAccent: string;
}

export const RPG_SYSTEMS_META: SystemMeta[] = [
  {
    id: "Dungeons & Dragons (D&D)",
    abbrev: "D&D 5e",
    shortName: "D&D 5ª Edição",
    fullName: "Dungeons & Dragons 5th Edition",
    genre: "Fantasia Medieval Épica",
    diceSystem: "d20 + Modificador vs CA/CD",
    icon: "⚔️",
    description: "O RPG de mesa mais popular do mundo. Classes clássicas, magias por slots, combate tático e progressão por níveis 1-20.",
    themeColor: "text-[#DFB56C]",
    badgeBg: "bg-[#DFB56C]/10 text-[#DFB56C] border-[#DFB56C]/30",
    borderAccent: "hover:border-[#DFB56C]/80",
  },
  {
    id: "Tormenta20 (T20)",
    abbrev: "T20",
    shortName: "Tormenta20",
    fullName: "Tormenta20: Jogo do Ano",
    genre: "Fantasia Medieval Brasileira",
    diceSystem: "d20 + Bônus • Pontos de Mana (PM)",
    icon: "⚡",
    description: "O maior RPG nacional. Cenário de Arton, poderes personalizáveis, sistema dinâmico de PM para magias e habilidades.",
    themeColor: "text-[#C4645A]",
    badgeBg: "bg-[#C4645A]/10 text-[#C4645A] border-[#C4645A]/30",
    borderAccent: "hover:border-[#C4645A]/80",
  },
  {
    id: "Pathfinder",
    abbrev: "PF 2e",
    shortName: "Pathfinder 2e",
    fullName: "Pathfinder Segunda Edição",
    genre: "Fantasia Tática Profunda",
    diceSystem: "d20 + 3 Ações por Turno • 4 Graus de Sucesso",
    icon: "🛡️",
    description: "Sistema tático de alta precisão com economia de 3 ações por turno, talentos modulares e regras customizáveis.",
    themeColor: "text-[#7E9FB0]",
    badgeBg: "bg-[#7E9FB0]/10 text-[#7E9FB0] border-[#7E9FB0]/30",
    borderAccent: "hover:border-[#7E9FB0]/80",
  },
  {
    id: "Call of Cthulhu",
    abbrev: "CoC 7e",
    shortName: "Call of Cthulhu",
    fullName: "Call of Cthulhu 7th Edition",
    genre: "Investigação & Horror Cósmico",
    diceSystem: "d100 Percentual • Sanidade & Ocultismo",
    icon: "🐙",
    description: "Horror lovecraftiano nos anos 1920 ou era moderna. Mecânica de sanidade mental, pistas investigativas e perigo letal.",
    themeColor: "text-[#8DAE8F]",
    badgeBg: "bg-[#8DAE8F]/10 text-[#8DAE8F] border-[#8DAE8F]/30",
    borderAccent: "hover:border-[#8DAE8F]/80",
  },
  {
    id: "Vampiro: A Máscara (Storyteller)",
    abbrev: "VTM 5e",
    shortName: "Vampiro V5",
    fullName: "Vampiro: A Máscara (V5)",
    genre: "Horror Pessoal & Política Sombria",
    diceSystem: "Parada de d10s • Dados de Fome",
    icon: "🦇",
    description: "Horror gótico-punk moderno. Conflitos de clãs vampíricos, humanidade vs a Besta interior e mecânica de Fome.",
    themeColor: "text-[#9E4B55]",
    badgeBg: "bg-[#9E4B55]/10 text-[#9E4B55] border-[#9E4B55]/30",
    borderAccent: "hover:border-[#9E4B55]/80",
  },
  {
    id: "Cyberpunk Red",
    abbrev: "CP RED",
    shortName: "Cyberpunk RED",
    fullName: "Cyberpunk RED (TTRPG)",
    genre: "Ficção Científica Distópica",
    diceSystem: "1d10 + Stat + Skill • Letalidade Alta",
    icon: "🤖",
    description: "Night City na Era do Vermelho. Ciberimplantes, tiroteios de alta tecnologia, corporações opressoras e estilo acima de tudo.",
    themeColor: "text-[#D94F5C]",
    badgeBg: "bg-[#D94F5C]/10 text-[#D94F5C] border-[#D94F5C]/30",
    borderAccent: "hover:border-[#D94F5C]/80",
  },
  {
    id: "Old Dragon",
    abbrev: "OD 2e",
    shortName: "Old Dragon 2e",
    fullName: "Old Dragon Segunda Edição",
    genre: "Old-School Renaissance (OSR)",
    diceSystem: "d20 Clássico • Exploração & Dungeon Crawl",
    icon: "🐉",
    description: "A essência clássica do RPG brasileiro dos anos 80/90 com regras modernas, combate ágil e foco na exploração de masmorras.",
    themeColor: "text-[#E5A84B]",
    badgeBg: "bg-[#E5A84B]/10 text-[#E5A84B] border-[#E5A84B]/30",
    borderAccent: "hover:border-[#E5A84B]/80",
  },
  {
    id: "GURPS",
    abbrev: "GURPS",
    shortName: "GURPS 4ª Ed.",
    fullName: "Generic Universal RolePlaying System",
    genre: "Sistema Universal & Modular",
    diceSystem: "3d6 Rolar Baixo • Compra por Pontos",
    icon: "🎯",
    description: "Simulação flexível para qualquer época e gênero. Criação detalhada por pontos de vantagens, desvantagens e perícias.",
    themeColor: "text-[#6BA396]",
    badgeBg: "bg-[#6BA396]/10 text-[#6BA396] border-[#6BA396]/30",
    borderAccent: "hover:border-[#6BA396]/80",
  },
  {
    id: "Savage Worlds",
    abbrev: "SWADE",
    shortName: "Savage Worlds",
    fullName: "Savage Worlds Adventure Edition",
    genre: "Ação Rápida & Cinematográfica",
    diceSystem: "Dados em Escala (d4 a d12) • Dado Selvagem",
    icon: "🎲",
    description: "Rápido, Furioso e Divertido! Perfeito para aventuras pulp, ação dinâmica e múltiplos cenários com cartas de iniciativa.",
    themeColor: "text-[#DF8050]",
    badgeBg: "bg-[#DF8050]/10 text-[#DF8050] border-[#DF8050]/30",
    borderAccent: "hover:border-[#DF8050]/80",
  },
  {
    id: "Fate Core",
    abbrev: "FATE",
    shortName: "Fate Core",
    fullName: "Fate Core System",
    genre: "Narrativa & Foco em Aspectos",
    diceSystem: "4dF (Dados Fudge: -4 a +4) • Pontos de Destino",
    icon: "🔮",
    description: "Motor focado na narrativa colaborativa. Aspectos de personagem, proezas dramáticas e economia de Pontos de Destino.",
    themeColor: "text-[#987CB8]",
    badgeBg: "bg-[#987CB8]/10 text-[#987CB8] border-[#987CB8]/30",
    borderAccent: "hover:border-[#987CB8]/80",
  },
  {
    id: "Outro / não especificar",
    abbrev: "OUTRO",
    shortName: "Homebrew / Outros",
    fullName: "Sistema Personalizado ou Livre",
    genre: "Regras Livres & Customizadas",
    diceSystem: "Fórmulas Customizáveis",
    icon: "✨",
    description: "Consulte regras genéricas, adapte sistemas independentes ou construa homebrews com auxílio do Mestre Arcano.",
    themeColor: "text-[#D6CEBE]",
    badgeBg: "bg-[#D6CEBE]/10 text-[#D6CEBE] border-[#D6CEBE]/30",
    borderAccent: "hover:border-[#D6CEBE]/80",
  },
];

interface SystemSelectorModalProps {
  isOpen: boolean;
  activeSystem: RpgSystem;
  onSelectSystem: (system: RpgSystem) => void;
  onClose: () => void;
}

export const SystemSelectorModal: React.FC<SystemSelectorModalProps> = ({
  isOpen,
  activeSystem,
  onSelectSystem,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredSystems = RPG_SYSTEMS_META.filter((sys) => {
    const term = searchTerm.toLowerCase();
    return (
      sys.abbrev.toLowerCase().includes(term) ||
      sys.shortName.toLowerCase().includes(term) ||
      sys.fullName.toLowerCase().includes(term) ||
      sys.genre.toLowerCase().includes(term) ||
      sys.diceSystem.toLowerCase().includes(term)
    );
  });

  return (
    <div role="dialog" aria-modal="true" aria-label="Selecionar sistema de RPG" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#171510] border border-[#38352A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#38352A] bg-[#1D1B14] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DFB56C]/10 border border-[#DFB56C]/30 flex items-center justify-center text-[#DFB56C]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#EFE8D8] flex items-center gap-2">
                <span>Escolher Sistema de RPG</span>
              </h2>
              <p className="text-xs text-[#A79C82]">
                O Mestre Arcano ajustará o vocabulário, regras, fórmulas e blocos de estatísticas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar seleção de sistema"
            className="p-1.5 text-[#8A8270] hover:text-[#EFE8D8] hover:bg-[#25231B] rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Stats Filter */}
        <div className="p-4 border-b border-[#2B2820] bg-[#14130E] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8A8270] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por abreviação (ex: D&D 5e, T20, CoC), gênero ou dados..."
              className="w-full bg-[#1A1812] border border-[#38352A] rounded-xl pl-9 pr-3 py-2 text-xs text-[#EFE8D8] placeholder-[#8A8270] focus:outline-none focus:border-[#DFB56C]"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8A8270] hover:text-[#EFE8D8]"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Systems Grid List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredSystems.map((sys) => {
            const isSelected = sys.id === activeSystem;
            return (
              <button
                key={sys.id}
                onClick={() => {
                  onSelectSystem(sys.id);
                  onClose();
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 group relative ${
                  isSelected
                    ? "bg-[#DFB56C]/10 border-[#DFB56C] shadow-md shadow-[#DFB56C]/5 ring-1 ring-[#DFB56C]/50"
                    : "bg-[#1B1913] border-[#38352A] hover:bg-[#232018] " + sys.borderAccent
                }`}
              >
                {/* System Icon / Avatar Badge */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 border transition-transform group-hover:scale-105 ${
                    isSelected
                      ? "bg-[#DFB56C]/20 border-[#DFB56C] text-[#DFB56C]"
                      : "bg-[#14130E] border-[#38352A]"
                  }`}
                >
                  {sys.icon}
                </div>

                {/* Info Column */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {/* Abbreviation Badge */}
                    <span
                      className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${sys.badgeBg}`}
                    >
                      {sys.abbrev}
                    </span>

                    <span className="font-serif font-bold text-sm text-[#EFE8D8] group-hover:text-white">
                      {sys.shortName}
                    </span>

                    <span className="text-[10px] font-mono text-[#8A8270]">
                      • {sys.genre}
                    </span>
                  </div>

                  <p className="text-xs text-[#A79C82] line-clamp-2 leading-relaxed mb-1.5">
                    {sys.description}
                  </p>

                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#DFB56C]/90">
                    <Dices className="w-3 h-3 text-[#DFB56C]" />
                    <span>{sys.diceSystem}</span>
                  </div>
                </div>

                {/* Selected Status / Arrow Indicator */}
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-[#DFB56C] text-[#14130E] flex items-center justify-center font-bold shadow">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#14130E] border border-[#38352A] text-[#8A8270] group-hover:text-[#DFB56C] group-hover:border-[#DFB56C]/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}

          {filteredSystems.length === 0 && (
            <div className="text-center py-12 text-[#8A8270]">
              <p className="text-sm">Nenhum sistema de RPG encontrado para "{searchTerm}".</p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-xs text-[#DFB56C] hover:underline"
              >
                Limpar busca
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-[#1D1B14] border-t border-[#38352A] flex items-center justify-between text-xs text-[#A79C82] px-4">
          <span className="font-mono text-[11px]">
            Sistema Ativo Atual:{" "}
            <strong className="text-[#DFB56C]">
              {RPG_SYSTEMS_META.find((s) => s.id === activeSystem)?.abbrev || activeSystem}
            </strong>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#25231B] hover:bg-[#322F24] border border-[#38352A] text-[#EFE8D8] text-xs font-mono transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
