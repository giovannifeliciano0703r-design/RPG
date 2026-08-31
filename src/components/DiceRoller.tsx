import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import {
  Dices,
  RotateCcw,
  X,
  Sparkles,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  MessageSquare,
  Flame,
  Zap,
  Check,
} from "lucide-react";
import { DiceRollResult, DiceType } from "../types";
import { AnimatedDie } from "./AnimatedDie";
import { diceAudio } from "../utils/diceAudio";

interface DiceRollerProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (rollDescription: string) => void;
}

const DICE_TYPES: { type: DiceType; max: number; label: string; sides: string; color: string }[] = [
  { type: "d4", max: 4, label: "d4", sides: "4 lados", color: "#DFB56C" },
  { type: "d6", max: 6, label: "d6", sides: "6 lados", color: "#C4645A" },
  { type: "d8", max: 8, label: "d8", sides: "8 lados", color: "#8DAE8F" },
  { type: "d10", max: 10, label: "d10", sides: "10 lados", color: "#A594D1" },
  { type: "d12", max: 12, label: "d12", sides: "12 lados", color: "#D99B6A" },
  { type: "d20", max: 20, label: "d20", sides: "20 lados", color: "#DFB56C" },
  { type: "d100", max: 100, label: "d100", sides: "100 lados", color: "#C5B8E6" },
];

const PRESETS = [
  { label: "🎯 Teste d20", dice: "d20" as DiceType, count: 1, mod: 0, mode: "normal" as const },
  { label: "⭐ Vantagem", dice: "d20" as DiceType, count: 2, mod: 0, mode: "advantage" as const },
  { label: "⚠️ Desvantagem", dice: "d20" as DiceType, count: 2, mod: 0, mode: "disadvantage" as const },
  { label: "⚔️ Dano 1d8+3", dice: "d8" as DiceType, count: 1, mod: 3, mode: "normal" as const },
  { label: "🔥 Bola de Fogo (8d6)", dice: "d6" as DiceType, count: 8, mod: 0, mode: "normal" as const },
  { label: "🩸 Cthulhu (1d100)", dice: "d100" as DiceType, count: 1, mod: 0, mode: "normal" as const },
  { label: "🐉 GURPS/T20 (3d6)", dice: "d6" as DiceType, count: 3, mod: 0, mode: "normal" as const },
];

export const DiceRoller: React.FC<DiceRollerProps> = ({ isOpen, onClose, onSendToChat }) => {
  const [selectedDice, setSelectedDice] = useState<DiceType>("d20");
  const [count, setCount] = useState<number>(1);
  const [modifier, setModifier] = useState<number>(0);
  const [mode, setMode] = useState<"normal" | "advantage" | "disadvantage">("normal");
  const [latestRoll, setLatestRoll] = useState<DiceRollResult | null>(null);
  const [history, setHistory] = useState<DiceRollResult[]>([]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [arenaDice, setArenaDice] = useState<{ id: string; value: number; isCrit?: boolean; isFumble?: boolean; isDiscarded?: boolean }[]>([]);
  const [rollImpact, setRollImpact] = useState<boolean>(false);

  const rollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync sound settings
  useEffect(() => {
    diceAudio.enabled = soundEnabled;
  }, [soundEnabled]);

  // Initial dice setup
  useEffect(() => {
    if (isOpen && arenaDice.length === 0) {
      // Default to 1d20 preview
      setArenaDice([{ id: "init-1", value: 20, isCrit: true }]);
    }
  }, [arenaDice.length, isOpen]);

  const currentDiceDef = DICE_TYPES.find((d) => d.type === selectedDice) || DICE_TYPES[5];

  const triggerHaptic = (ms: number = 30) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        // Safe fallback
      }
    }
  };

  const executeRoll = (
    overrideDice?: DiceType,
    overrideCount?: number,
    overrideMod?: number,
    overrideMode?: "normal" | "advantage" | "disadvantage"
  ) => {
    const diceToRoll = overrideDice || selectedDice;
    const countToRoll = overrideCount !== undefined ? overrideCount : count;
    const modToRoll = overrideMod !== undefined ? overrideMod : modifier;
    const modeToRoll = overrideMode || mode;

    const diceDef = DICE_TYPES.find((d) => d.type === diceToRoll) || currentDiceDef;
    const maxVal = diceDef.max;

    if (rollTimeoutRef.current) {
      clearTimeout(rollTimeoutRef.current);
    }

    triggerHaptic(40);
    setIsRolling(true);
    setRollImpact(false);

    // Play synthesized dice clatter sound
    const totalPhysicalDice = diceToRoll === "d20" && (modeToRoll === "advantage" || modeToRoll === "disadvantage") ? 2 : countToRoll;
    diceAudio.playDiceRoll(totalPhysicalDice);

    // Initial placeholder dice for animation
    const tempDice = Array.from({ length: totalPhysicalDice }).map((_, i) => ({
      id: `temp-${i}-${Date.now()}`,
      value: Math.floor(Math.random() * maxVal) + 1,
    }));
    setArenaDice(tempDice);

    // Rolling animation time (600ms for dynamic physical feel)
    rollTimeoutRef.current = setTimeout(() => {
      let individualRolls: number[] = [];
      let selectedRolls: number[] = [];
      let isCrit = false;
      let isFumble = false;

      const finalArenaDice: { id: string; value: number; isCrit?: boolean; isFumble?: boolean; isDiscarded?: boolean }[] = [];

      if (diceToRoll === "d20" && (modeToRoll === "advantage" || modeToRoll === "disadvantage")) {
        const roll1 = Math.floor(Math.random() * 20) + 1;
        const roll2 = Math.floor(Math.random() * 20) + 1;
        individualRolls = [roll1, roll2];

        const chosenIndex = modeToRoll === "advantage" ? (roll1 >= roll2 ? 0 : 1) : (roll1 <= roll2 ? 0 : 1);
        const discardedIndex = chosenIndex === 0 ? 1 : 0;
        const chosen = individualRolls[chosenIndex];

        selectedRolls = [chosen];
        if (chosen === 20) isCrit = true;
        if (chosen === 1) isFumble = true;

        finalArenaDice.push({
          id: `die-0-${Date.now()}`,
          value: roll1,
          isCrit: roll1 === 20 && chosenIndex === 0,
          isFumble: roll1 === 1 && chosenIndex === 0,
          isDiscarded: discardedIndex === 0,
        });

        finalArenaDice.push({
          id: `die-1-${Date.now()}`,
          value: roll2,
          isCrit: roll2 === 20 && chosenIndex === 1,
          isFumble: roll2 === 1 && chosenIndex === 1,
          isDiscarded: discardedIndex === 1,
        });
      } else {
        for (let i = 0; i < countToRoll; i++) {
          const roll = Math.floor(Math.random() * maxVal) + 1;
          individualRolls.push(roll);
          const dieIsCrit = diceToRoll === "d20" && roll === 20;
          const dieIsFumble = diceToRoll === "d20" && roll === 1;

          if (dieIsCrit) isCrit = true;
          if (dieIsFumble) isFumble = true;

          finalArenaDice.push({
            id: `die-${i}-${Date.now()}`,
            value: roll,
            isCrit: dieIsCrit,
            isFumble: dieIsFumble,
            isDiscarded: false,
          });
        }
        selectedRolls = [...individualRolls];
      }

      const sumSelected = selectedRolls.reduce((a, b) => a + b, 0);
      const total = sumSelected + modToRoll;

      const result: DiceRollResult = {
        id: `roll-${Date.now()}`,
        diceType: diceToRoll,
        count: countToRoll,
        modifier: modToRoll,
        mode: modeToRoll,
        individualRolls,
        selectedRolls,
        total,
        isCrit,
        isFumble,
        timestamp: Date.now(),
      };

      setArenaDice(finalArenaDice);
      setLatestRoll(result);
      setHistory((prev) => [result, ...prev.slice(0, 19)]);
      setIsRolling(false);
      setRollImpact(true);

      // Sound & visual celebrations
      if (isCrit) {
        triggerHaptic(120);
        diceAudio.playCritSuccess();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.55 },
          colors: ["#FFE599", "#DFB56C", "#B08635", "#F3EFE6"],
        });
      } else if (isFumble) {
        triggerHaptic(90);
        diceAudio.playFumble();
      } else {
        triggerHaptic(30);
      }
    }, 600);
  };

  // Reroll single die in arena
  const handleRerollSingle = (index: number) => {
    if (isRolling || !latestRoll) return;

    triggerHaptic(30);
    diceAudio.playDiceRoll(1);

    const maxVal = currentDiceDef.max;
    const newRoll = Math.floor(Math.random() * maxVal) + 1;
    const isDieCrit = selectedDice === "d20" && newRoll === 20;
    const isDieFumble = selectedDice === "d20" && newRoll === 1;

    const updatedArena = [...arenaDice];
    updatedArena[index] = {
      ...updatedArena[index],
      value: newRoll,
      isCrit: isDieCrit,
      isFumble: isDieFumble,
    };
    setArenaDice(updatedArena);

    // Recompute total if not discarded
    if (!updatedArena[index].isDiscarded) {
      const activeValues = updatedArena.filter((d) => !d.isDiscarded).map((d) => d.value);
      const newTotal = activeValues.reduce((a, b) => a + b, 0) + modifier;
      const anyCrit = updatedArena.some((d) => d.isCrit && !d.isDiscarded);
      const anyFumble = updatedArena.some((d) => d.isFumble && !d.isDiscarded);

      setLatestRoll({
        ...latestRoll,
        individualRolls: updatedArena.map((d) => d.value),
        selectedRolls: activeValues,
        total: newTotal,
        isCrit: anyCrit,
        isFumble: anyFumble,
      });

      if (isDieCrit) {
        diceAudio.playCritSuccess();
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.55 },
          colors: ["#FFE599", "#DFB56C", "#B08635"],
        });
      }
    }
  };

  // Apply Preset
  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setSelectedDice(preset.dice);
    setCount(preset.count);
    setModifier(preset.mod);
    setMode(preset.mode);
    executeRoll(preset.dice, preset.count, preset.mod, preset.mode);
  };

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Rolador de dados" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="w-full sm:max-w-2xl bg-[#1C1A14] border-t sm:border border-[#38352A] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-[#38352A] rounded-full mx-auto mt-2.5 mb-1" />

        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#2D2A21] bg-[#16140F]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B08635]/20 border border-[#DFB56C]/50 flex items-center justify-center text-[#DFB56C] shadow-xs">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#F3EFE6] tracking-tight">
                Mesa de Dados Viva
              </h3>
              <p className="text-[10.5px] text-[#8A8270] font-mono">
                Animações Físicas • D4 até D100 • Vantagem & Fórmulas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Desativar Sons dos Dados" : "Ativar Sons dos Dados"}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                soundEnabled
                  ? "bg-[#25231B] text-[#DFB56C] border-[#38352A] hover:border-[#DFB56C]/60"
                  : "bg-[#14130E] text-[#8A8270] border-[#2D2A21]"
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              aria-label="Fechar rolador de dados"
              title="Fechar"
              className="text-[#8A8270] hover:text-[#F3EFE6] p-1.5 rounded-lg hover:bg-[#25231B] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* ================= FELT ROLLING ARENA (MESA EM FELTRO) ================= */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-[#38352A] shadow-inner bg-radial from-[#1A261D] via-[#111A13] to-[#0A100B] p-4 sm:p-6 min-h-[190px] flex flex-col items-center justify-center">
            {/* Ambient Velvet Texture Lines & Runic Borders */}
            <div className="absolute inset-0 border border-[#8DAE8F]/15 rounded-xl pointer-events-none m-1.5" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(141,174,143,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* Arena Header Hint */}
            <div className="absolute top-2 left-3 right-3 flex items-center justify-between pointer-events-none">
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#8DAE8F]/70 font-semibold flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Arena de Rolagem Arcana
              </span>
              {arenaDice.length > 0 && !isRolling && (
                <span className="font-mono text-[9px] text-[#A79C82]/60 hidden sm:inline">
                  Toque em um dado para rolar novamente
                </span>
              )}
            </div>

            {/* Dynamic Rolling Dice Stage */}
            <div
              className={`w-full py-2 flex items-center justify-center flex-wrap gap-3 sm:gap-4 transition-transform ${
                rollImpact ? "animate-dice-impact" : ""
              }`}
            >
              {arenaDice.map((die, idx) => (
                <AnimatedDie
                  key={die.id}
                  index={idx}
                  diceType={selectedDice}
                  value={die.value}
                  maxVal={currentDiceDef.max}
                  isRolling={isRolling}
                  isCrit={die.isCrit}
                  isFumble={die.isFumble}
                  isDiscarded={die.isDiscarded}
                  onRerollSingle={() => handleRerollSingle(idx)}
                />
              ))}
            </div>

            {/* Total / Breakdown Banner */}
            {latestRoll && !isRolling && (
              <div className="mt-3 flex flex-col sm:flex-row items-center gap-2 bg-[#0E1510]/85 border border-[#4B6B4E]/50 px-4 py-2 rounded-xl backdrop-blur-md shadow-lg animate-fade-in z-10">
                <div className="flex items-center gap-2 font-mono text-xs text-[#A79C82]">
                  <span>Fórmula:</span>
                  <span className="text-[#EFE8D8] font-bold">
                    {latestRoll.count > 1 ? `${latestRoll.count}` : ""}
                    {latestRoll.diceType}
                    {latestRoll.modifier !== 0
                      ? latestRoll.modifier > 0
                        ? ` + ${latestRoll.modifier}`
                        : ` - ${Math.abs(latestRoll.modifier)}`
                      : ""}
                  </span>
                  <span>➜</span>
                  <span className="text-[#8DAE8F]">
                    [{latestRoll.selectedRolls.join(" + ")}]
                    {latestRoll.modifier !== 0
                      ? latestRoll.modifier > 0
                        ? ` + ${latestRoll.modifier}`
                        : ` - ${Math.abs(latestRoll.modifier)}`
                      : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs uppercase text-[#8A8270]">Total:</span>
                  <span
                    className={`font-mono text-xl font-black ${
                      latestRoll.isCrit
                        ? "text-[#DFB56C] drop-shadow-[0_0_8px_rgba(223,181,108,0.8)]"
                        : latestRoll.isFumble
                        ? "text-[#C4645A]"
                        : "text-[#F3EFE6]"
                    }`}
                  >
                    {latestRoll.total}
                  </span>

                  {/* Send to chat button */}
                  {onSendToChat && (
                    <button
                      onClick={() => {
                        const rollText = `🎲 **Rolagem (${latestRoll.count}${latestRoll.diceType}${
                          latestRoll.modifier ? (latestRoll.modifier > 0 ? `+${latestRoll.modifier}` : latestRoll.modifier) : ""
                        })**: Resultado **${latestRoll.total}** ${
                          latestRoll.isCrit ? "✨ (Crítico!)" : latestRoll.isFumble ? "💀 (Falha Crítica!)" : ""
                        } [Valores: ${latestRoll.selectedRolls.join(", ")}]`;
                        onSendToChat(rollText);
                        onClose();
                      }}
                      title="Enviar resultado para o chat da campanha"
                      className="ml-2 px-2 py-1 bg-[#4B6B4E]/30 hover:bg-[#4B6B4E]/50 border border-[#4B6B4E]/60 text-[#8DAE8F] hover:text-[#E9F1E9] text-[10px] font-mono rounded flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>No Chat</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ================= QUICK RPG PRESETS BAR ================= */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#8A8270] mb-2 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#DFB56C]" />
              <span>Atalhos Rápidos de RPG:</span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
              {PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1.5 bg-[#16140F] hover:bg-[#25231B] border border-[#2D2A21] hover:border-[#DFB56C]/50 text-[#D6CEBE] text-xs font-mono rounded-lg whitespace-nowrap transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* ================= TACTILE DICE TYPE SELECTOR ================= */}
          <div>
            <div className="text-[10.5px] font-mono uppercase tracking-wider text-[#8A8270] mb-2 flex justify-between">
              <span>Tipo de Dado:</span>
              <span className="text-[#DFB56C] font-semibold">{currentDiceDef.sides}</span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
              {DICE_TYPES.map((dice) => {
                const isSel = selectedDice === dice.type;
                return (
                  <button
                    key={dice.type}
                    onClick={() => {
                      triggerHaptic(20);
                      setSelectedDice(dice.type);
                    }}
                    className={`min-h-[46px] rounded-xl font-mono text-sm font-bold flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 ${
                      isSel
                        ? "bg-[#7A2E27] text-white border-2 border-[#DFB56C] shadow-lg shadow-[#7A2E27]/30 scale-102"
                        : "bg-[#14130E] text-[#8A8270] border border-[#2D2A21] hover:border-[#8DAE8F] hover:text-[#F3EFE6]"
                    }`}
                  >
                    <span>{dice.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= D20 ADVANTAGE / DISADVANTAGE MODES ================= */}
          {selectedDice === "d20" && (
            <div className="bg-[#16140F] border border-[#2D2A21] p-2.5 rounded-xl space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-[#8A8270]">
                Mecânica de Rolagem (D20):
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setMode("normal");
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer active:scale-95 ${
                    mode === "normal"
                      ? "bg-[#4B6B4E] text-[#E9F1E9] font-bold border border-[#8DAE8F]"
                      : "bg-[#1C1A14] text-[#8A8270] border border-[#2D2A21]"
                  }`}
                >
                  Normal (1d20)
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setMode("advantage");
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer active:scale-95 ${
                    mode === "advantage"
                      ? "bg-[#4B6B4E] text-[#E9F1E9] font-bold border border-[#8DAE8F]"
                      : "bg-[#1C1A14] text-[#8A8270] border border-[#2D2A21]"
                  }`}
                >
                  Vantagem (2d20)
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setMode("disadvantage");
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer active:scale-95 ${
                    mode === "disadvantage"
                      ? "bg-[#7A2E27] text-white font-bold border border-[#DFB56C]"
                      : "bg-[#1C1A14] text-[#8A8270] border border-[#2D2A21]"
                  }`}
                >
                  Desvantagem
                </button>
              </div>
            </div>
          )}

          {/* ================= QUANTITY & MODIFIER CONTROLS ================= */}
          <div className="grid grid-cols-2 gap-3">
            {/* Quantity */}
            <div className="bg-[#16140F] border border-[#2D2A21] p-3 rounded-xl">
              <div className="text-[10px] font-mono uppercase text-[#8A8270] mb-1.5">
                Quantidade de Dados:
              </div>
              <div className="flex items-center justify-between">
                <button
                  disabled={count <= 1 || (selectedDice === "d20" && mode !== "normal")}
                  onClick={() => {
                    triggerHaptic(15);
                    setCount(Math.max(1, count - 1));
                  }}
                  className="w-10 h-10 rounded-lg bg-[#1C1A14] hover:bg-[#25231B] border border-[#2D2A21] text-[#F3EFE6] flex items-center justify-center active:scale-90 disabled:opacity-30 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono text-xl font-bold text-[#DFB56C]">{count}x</span>
                <button
                  disabled={count >= 20 || (selectedDice === "d20" && mode !== "normal")}
                  onClick={() => {
                    triggerHaptic(15);
                    setCount(Math.min(20, count + 1));
                  }}
                  className="w-10 h-10 rounded-lg bg-[#1C1A14] hover:bg-[#25231B] border border-[#2D2A21] text-[#F3EFE6] flex items-center justify-center active:scale-90 disabled:opacity-30 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modifier */}
            <div className="bg-[#16140F] border border-[#2D2A21] p-3 rounded-xl">
              <div className="text-[10px] font-mono uppercase text-[#8A8270] mb-1.5">
                Modificador (+ / -):
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setModifier((m) => m - 1);
                  }}
                  className="w-10 h-10 rounded-lg bg-[#1C1A14] hover:bg-[#25231B] border border-[#2D2A21] text-[#F3EFE6] flex items-center justify-center active:scale-90 cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-mono text-xl font-bold text-[#F3EFE6]">
                  {modifier >= 0 ? `+${modifier}` : modifier}
                </span>
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setModifier((m) => m + 1);
                  }}
                  className="w-10 h-10 rounded-lg bg-[#1C1A14] hover:bg-[#25231B] border border-[#2D2A21] text-[#F3EFE6] flex items-center justify-center active:scale-90 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ================= BIG ACTION ROLL BUTTON ================= */}
          <button
            onClick={() => executeRoll()}
            disabled={isRolling}
            className="w-full min-h-[52px] bg-gradient-to-r from-[#7A2E27] via-[#8F392F] to-[#7A2E27] hover:brightness-110 active:scale-98 text-white font-serif font-bold text-base rounded-xl shadow-lg shadow-[#7A2E27]/40 flex items-center justify-center gap-2 transition-all cursor-pointer border border-[#DFB56C]/40"
          >
            <Dices className={`w-5 h-5 ${isRolling ? "animate-spin" : ""}`} />
            <span>
              {isRolling
                ? "Rolando dados na arena..."
                : `JOGAR DADOS (${count}${selectedDice}${
                    modifier ? (modifier > 0 ? `+${modifier}` : modifier) : ""
                  })`}
            </span>
          </button>

          {/* ================= RECENT HISTORY LOG ================= */}
          {history.length > 0 && (
            <div className="p-3 border border-[#2D2A21] bg-[#14130E] rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8A8270]">
                  Histórico Recente ({history.length})
                </span>
                <button
                  onClick={() => setHistory([])}
                  className="text-[11px] text-[#8A8270] hover:text-[#C4645A] flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" /> Limpar
                </button>
              </div>
              <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                {history.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      setSelectedDice(h.diceType);
                      setCount(h.count);
                      setModifier(h.modifier);
                      setMode(h.mode);
                      executeRoll(h.diceType, h.count, h.modifier, h.mode);
                    }}
                    title="Clique para repetir esta rolagem"
                    className="flex items-center justify-between text-xs font-mono bg-[#1C1A14] hover:bg-[#25231B] px-2.5 py-1.5 rounded-lg border border-[#2D2A21] transition-colors cursor-pointer"
                  >
                    <span className="text-[#8A8270]">
                      {h.count > 1 ? `${h.count}${h.diceType}` : h.diceType}
                      {h.modifier ? ` (${h.modifier > 0 ? `+${h.modifier}` : h.modifier})` : ""}:
                    </span>
                    <span
                      className={`font-semibold ${
                        h.isCrit ? "text-[#DFB56C]" : h.isFumble ? "text-[#C4645A]" : "text-[#F3EFE6]"
                      }`}
                    >
                      {h.total}
                    </span>
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
