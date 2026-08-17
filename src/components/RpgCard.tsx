import React, { useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Copy,
  Check,
  Sparkles,
  Shield,
  Wand2,
  Sword,
  Scroll,
  Dices,
  Flame,
  Info,
  BookOpen,
} from "lucide-react";
import { ParsedRpgCard, ConfidenceLevel } from "../types";

interface RpgCardProps {
  card: ParsedRpgCard;
  isBookmarked?: boolean;
  onToggleBookmark?: (card: ParsedRpgCard) => void;
  onAskFollowUp?: (promptText: string) => void;
}

export const RpgCard: React.FC<RpgCardProps> = ({
  card,
  isBookmarked = false,
  onToggleBookmark,
  onAskFollowUp,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(card.rawText || `${card.name}\n${card.description || ""}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (category: string) => {
    const cat = (category || "").toLowerCase();
    if (cat.includes("classe")) return <Sword className="w-3.5 h-3.5 text-[#DFB56C]" />;
    if (cat.includes("magia") || cat.includes("feitiço")) return <Wand2 className="w-3.5 h-3.5 text-[#8DAE8F]" />;
    if (cat.includes("raça") || cat.includes("linhagem") || cat.includes("ancestralidade"))
      return <Shield className="w-3.5 h-3.5 text-[#B08635]" />;
    if (cat.includes("vantagem") || cat.includes("talento")) return <Sparkles className="w-3.5 h-3.5 text-[#DFB56C]" />;
    if (cat.includes("item") || cat.includes("equipamento")) return <Scroll className="w-3.5 h-3.5 text-[#A79C82]" />;
    if (cat.includes("buff") || cat.includes("debuff")) return <Flame className="w-3.5 h-3.5 text-[#C4645A]" />;
    return <Info className="w-3.5 h-3.5 text-[#A79C82]" />;
  };

  const getConfidenceBadge = (conf: ConfidenceLevel) => {
    switch (conf) {
      case "Alta":
        return {
          border: "border-[#4B6B4E]/40",
          text: "text-[#8DAE8F]",
          bg: "bg-[#4B6B4E]/15",
          label: "Alta Confiança",
        };
      case "Média":
        return {
          border: "border-[#B08635]/40",
          text: "text-[#DFB56C]",
          bg: "bg-[#B08635]/15",
          label: "Média Confiança",
        };
      case "Baixa":
      default:
        return {
          border: "border-[#7A2E27]/40",
          text: "text-[#C4645A]",
          bg: "bg-[#7A2E27]/15",
          label: "Incerteza / Homebrew",
        };
    }
  };

  const confBadge = getConfidenceBadge(card.confidence);

  return (
    <div
      id={`rpg-card-${card.id}`}
      className="group relative bg-[#1B1914] text-[#EFE8D8] rounded-2xl border border-[#38352A] p-5 sm:p-6 transition-all duration-200 hover:border-[#4E4A3B] shadow-sm flex flex-col"
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[#A79C82] bg-[#14130E] px-2 py-0.5 rounded-md border border-[#2D2A21]">
              {getCategoryIcon(card.category)}
              <span>{card.category || "Elemento"}</span>
            </span>

            {card.systemEd && (
              <span className="text-[11px] font-mono text-[#DFB56C] bg-[#B08635]/10 border border-[#B08635]/25 px-2 py-0.5 rounded-md truncate max-w-[180px] sm:max-w-none">
                {card.systemEd}
              </span>
            )}
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#F3EFE6] tracking-tight leading-snug break-words">
            {card.name}
          </h2>
        </div>

        {/* Minimalist Action Controls */}
        <div className="flex items-center gap-1 bg-[#14130E] p-1 rounded-lg border border-[#2D2A21] shrink-0">
          <button
            id={`btn-copy-${card.id}`}
            onClick={handleCopy}
            title={copied ? "Copiado!" : "Copiar"}
            className="p-1.5 text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#25231B] active:scale-95 rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#8DAE8F]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {onToggleBookmark && (
            <button
              id={`btn-bookmark-${card.id}`}
              onClick={() => onToggleBookmark(card)}
              title={isBookmarked ? "Salvo no Grimório" : "Salvar no Grimório"}
              className={`p-1.5 rounded transition-colors active:scale-95 ${
                isBookmarked
                  ? "text-[#DFB56C] bg-[#DFB56C]/10"
                  : "text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#25231B]"
              }`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-3.5 h-3.5 fill-[#DFB56C]" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="space-y-3.5 text-[14px] leading-relaxed text-[#D6CEBE]">
        {/* Description */}
        {card.description && (
          <p className="text-[#EFE8D8] leading-relaxed font-sans">{card.description}</p>
        )}

        {/* Attributes & Requirements */}
        {card.attributes && (
          <div className="bg-[#14130E] border border-[#2D2A21] rounded-xl px-3.5 py-2.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-[#A79C82] uppercase text-[10.5px] tracking-wider">Requisitos:</span>
            <span className="font-medium text-[#DFB56C]">{card.attributes}</span>
          </div>
        )}

        {/* Abilities & Effects */}
        {card.abilities && card.abilities.length > 0 && (
          <div className="pt-1">
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#A79C82] mb-1.5">
              Habilidades &amp; Efeitos
            </div>
            <ul className="space-y-1.5 pl-1">
              {card.abilities.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm">
                  <span className="text-[#DFB56C] mt-0.5 shrink-0 text-xs">✦</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Advantages & Disadvantages Side by Side */}
        {(card.advantages?.length > 0 || card.disadvantages?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {card.advantages && card.advantages.length > 0 && (
              <div className="bg-[#14130E]/60 border border-[#2D2A21] rounded-xl p-3">
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#8DAE8F] mb-1.5">
                  Vantagens
                </div>
                <ul className="space-y-1 text-xs sm:text-[13px]">
                  {card.advantages.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#8DAE8F] shrink-0 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {card.disadvantages && card.disadvantages.length > 0 && (
              <div className="bg-[#14130E]/60 border border-[#2D2A21] rounded-xl p-3">
                <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#C4645A] mb-1.5">
                  Desvantagens / Custos
                </div>
                <ul className="space-y-1 text-xs sm:text-[13px]">
                  {card.disadvantages.map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#C4645A] shrink-0 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Buffs & Debuffs */}
        {card.buffsDebuffs && (
          <div className="bg-[#7A2E27]/10 border border-[#7A2E27]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#F3E8E4] flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-[#C4645A] shrink-0" />
            <span><strong className="text-[#DFB56C]">Condições:</strong> {card.buffsDebuffs}</span>
          </div>
        )}

        {/* Extra Fields */}
        {card.extraFields &&
          card.extraFields.map((field, idx) => (
            <div key={idx} className="pt-1">
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-[#A79C82] mb-1">
                {field.label}
              </div>
              {field.value && <p className="text-xs sm:text-sm text-[#EFE8D8]">{field.value}</p>}
              {field.items.length > 0 && (
                <ul className="space-y-1 text-xs sm:text-sm mt-1">
                  {field.items.map((it, j) => (
                    <li key={j} className="flex items-start gap-2">
                      <span className="text-[#DFB56C] shrink-0 font-bold">•</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </div>

      {/* Card Footer */}
      <div className="mt-4 pt-3 border-t border-[#2D2A21] flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#A79C82]">
          <BookOpen className="w-3 h-3 text-[#A79C82]" />
          <span>{card.source || "Regras Oficiais"}</span>
        </div>

        <span
          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${confBadge.border} ${confBadge.text} ${confBadge.bg}`}
        >
          {confBadge.label}
        </span>
      </div>

      {/* Follow-up Prompts */}
      {onAskFollowUp && (
        <div className="mt-3 pt-2 border-t border-dashed border-[#2D2A21] flex flex-wrap items-center gap-1.5">
          <span className="text-[10.5px] font-mono text-[#A79C82]">Explorar:</span>
          <button
            onClick={() => onAskFollowUp(`Explique como jogar melhor com ${card.name} e suas sinergias`)}
            className="text-[11px] bg-[#14130E] hover:bg-[#25231B] text-[#DFB56C] px-2.5 py-1 rounded-md border border-[#2D2A21] hover:border-[#DFB56C]/40 transition-colors"
          >
            Sinergias &amp; Dicas
          </button>
          <button
            onClick={() => onAskFollowUp(`Quais são os itens e talentos recomendados para ${card.name}?`)}
            className="text-[11px] bg-[#14130E] hover:bg-[#25231B] text-[#DFB56C] px-2.5 py-1 rounded-md border border-[#2D2A21] hover:border-[#DFB56C]/40 transition-colors"
          >
            Equipamentos
          </button>
        </div>
      )}
    </div>
  );
};
