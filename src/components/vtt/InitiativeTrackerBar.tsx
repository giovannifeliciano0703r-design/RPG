import React from "react";
import {
  Swords,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Plus,
  Trash2,
  Heart,
  Shield,
  Dice5,
} from "lucide-react";
import { InitiativeCombatant } from "../../types";

interface InitiativeTrackerBarProps {
  combatants: InitiativeCombatant[];
  currentTurnIndex: number;
  round: number;
  onNextTurn: () => void;
  onPrevTurn: () => void;
  onResetCombat: () => void;
  onUpdateCombatant: (id: string, updated: Partial<InitiativeCombatant>) => void;
  onRemoveCombatant: (id: string) => void;
  onAddCombatant: () => void;
  isGm: boolean;
}

export const InitiativeTrackerBar: React.FC<InitiativeTrackerBarProps> = ({
  combatants,
  currentTurnIndex,
  round,
  onNextTurn,
  onPrevTurn,
  onResetCombat,
  onUpdateCombatant,
  onRemoveCombatant,
  onAddCombatant,
  isGm,
}) => {
  if (combatants.length === 0) return null;

  const currentCombatant = combatants[currentTurnIndex];

  return (
    <div className="bg-[#15140F] border-b border-[#38352A] px-4 py-2 flex items-center justify-between gap-3 overflow-x-auto text-xs z-20 shrink-0">
      {/* Round indicator & turn controller */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 bg-[#1C1A14] border border-[#7A2E27] px-2.5 py-1 rounded-xl">
          <Swords className="w-3.5 h-3.5 text-[#DFB56C]" />
          <span className="font-serif font-bold text-[#EFE8D8]">Rodada {round}</span>
        </div>

        {isGm && (
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevTurn}
              className="p-1 bg-[#25231B] hover:bg-[#322f24] text-[#A79C82] hover:text-[#EFE8D8] rounded-lg"
              title="Turno Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={onNextTurn}
              className="px-2.5 py-1 bg-[#DFB56C] hover:bg-[#b08635] text-[#15140F] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              title="Próximo Turno"
            >
              <span>Próximo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Combatant Cards Row */}
      <div className="flex items-center gap-2 overflow-x-auto py-1">
        {combatants.map((c, idx) => {
          const isCurrent = idx === currentTurnIndex;
          return (
            <div
              key={c.id}
              className={`p-2 rounded-xl border flex items-center gap-2 shrink-0 transition-all ${
                isCurrent
                  ? "bg-[#DFB56C]/20 border-[#DFB56C] ring-2 ring-[#DFB56C]/50 shadow-md scale-105"
                  : "bg-[#1C1A14] border-[#38352A] opacity-80"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                  c.isEnemy ? "bg-[#7A2E27] text-[#EFE8D8]" : "bg-[#25231B] text-[#DFB56C]"
                }`}
              >
                {c.initiativeRoll}
              </div>

              <div className="min-w-0">
                <p className="font-serif font-bold text-xs text-[#EFE8D8] truncate max-w-[100px]">{c.name}</p>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#A79C82]">
                  <span className="flex items-center gap-0.5 text-[#C4645A]">
                    <Heart className="w-2.5 h-2.5" /> {c.currentHp}
                  </span>
                  <span className="flex items-center gap-0.5 text-[#7E9FB0]">
                    <Shield className="w-2.5 h-2.5" /> {c.ac}
                  </span>
                </div>
              </div>

              {isGm && (
                <button
                  onClick={() => onRemoveCombatant(c.id)}
                  className="text-[#A79C82] hover:text-[#C4645A] p-0.5"
                  title="Remover do combate"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* GM Reset / Add */}
      {isGm && (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onAddCombatant}
            className="p-1 bg-[#1C1A14] border border-[#38352A] hover:border-[#DFB56C] text-[#DFB56C] rounded-lg"
            title="Adicionar Combatente Manual"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetCombat}
            className="p-1 bg-[#1C1A14] border border-[#38352A] hover:border-[#C4645A] text-[#A79C82] hover:text-[#C4645A] rounded-lg"
            title="Resetar Ordem de Iniciativa"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
