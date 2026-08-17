import React, { useEffect, useState } from "react";
import { Sparkles, Skull, RotateCcw } from "lucide-react";
import { DiceType } from "../types";

interface AnimatedDieProps {
  diceType: DiceType;
  value: number;
  maxVal: number;
  isRolling: boolean;
  isCrit?: boolean;
  isFumble?: boolean;
  isDiscarded?: boolean;
  onRerollSingle?: () => void;
  index?: number;
}

export const AnimatedDie: React.FC<AnimatedDieProps> = ({
  diceType,
  value,
  maxVal,
  isRolling,
  isCrit = false,
  isFumble = false,
  isDiscarded = false,
  onRerollSingle,
  index = 0,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [randomOffset] = useState(() => ({
    rotX: (Math.random() - 0.5) * 40,
    rotY: (Math.random() - 0.5) * 40,
    rotZ: (Math.random() - 0.5) * 25,
    delay: (index % 6) * 40,
  }));

  // Rapid cycling numbers while rolling
  useEffect(() => {
    if (isRolling) {
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * maxVal) + 1);
      }, 55);
      return () => clearInterval(interval);
    } else {
      setDisplayValue(value);
    }
  }, [isRolling, maxVal, value]);

  // Color schemes based on dice type & state
  const getDiceStyling = () => {
    if (isDiscarded) {
      return {
        bg: "bg-[#1F1D16]/60",
        border: "border-[#38352A]",
        text: "text-[#8A8270] line-through opacity-50",
        glow: "",
        accent: "#8A8270",
      };
    }
    if (isCrit) {
      return {
        bg: "bg-gradient-to-br from-[#73521E] via-[#B08635] to-[#DFB56C]",
        border: "border-[#FFE599] shadow-lg shadow-[#DFB56C]/50 ring-2 ring-[#DFB56C]/60",
        text: "text-[#15140F] font-black drop-shadow-md",
        glow: "animate-pulse shadow-[0_0_25px_rgba(223,181,108,0.7)]",
        accent: "#FFE599",
      };
    }
    if (isFumble) {
      return {
        bg: "bg-gradient-to-br from-[#4A1813] via-[#7A2E27] to-[#C4645A]",
        border: "border-[#FF8A80] shadow-lg shadow-[#C4645A]/40 ring-2 ring-[#C4645A]/50",
        text: "text-white font-black drop-shadow-md",
        glow: "shadow-[0_0_20px_rgba(196,100,90,0.6)]",
        accent: "#FF8A80",
      };
    }

    switch (diceType) {
      case "d4":
        return {
          bg: "bg-gradient-to-b from-[#2B2820] to-[#171510]",
          border: "border-[#DFB56C]/70",
          text: "text-[#DFB56C]",
          glow: "hover:border-[#DFB56C]",
          accent: "#DFB56C",
        };
      case "d6":
        return {
          bg: "bg-gradient-to-b from-[#232018] to-[#14130E]",
          border: "border-[#C4645A]/70",
          text: "text-[#EFE8D8]",
          glow: "hover:border-[#C4645A]",
          accent: "#C4645A",
        };
      case "d8":
        return {
          bg: "bg-gradient-to-b from-[#1C261E] to-[#111912]",
          border: "border-[#8DAE8F]/70",
          text: "text-[#8DAE8F]",
          glow: "hover:border-[#8DAE8F]",
          accent: "#8DAE8F",
        };
      case "d10":
      case "d100":
        return {
          bg: "bg-gradient-to-b from-[#23202E] to-[#15131C]",
          border: "border-[#A594D1]/70",
          text: "text-[#C5B8E6]",
          glow: "hover:border-[#A594D1]",
          accent: "#A594D1",
        };
      case "d12":
        return {
          bg: "bg-gradient-to-b from-[#2D221A] to-[#1A130E]",
          border: "border-[#D99B6A]/70",
          text: "text-[#F0B888]",
          glow: "hover:border-[#D99B6A]",
          accent: "#D99B6A",
        };
      case "d20":
      default:
        return {
          bg: "bg-gradient-to-br from-[#281F1A] via-[#1E1914] to-[#120F0C]",
          border: "border-[#DFB56C]",
          text: "text-[#F3EFE6]",
          glow: "hover:border-[#DFB56C] shadow-md shadow-[#DFB56C]/10",
          accent: "#DFB56C",
        };
    }
  };

  const style = getDiceStyling();

  // Render SVG polyhedral faceted backgrounds
  const renderDiceFace = () => {
    switch (diceType) {
      case "d4":
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <polygon points="50,10 90,85 10,85" fill="none" stroke={style.accent} strokeWidth="3" />
            <line x1="50" y1="10" x2="50" y2="60" stroke={style.accent} strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="10" y1="85" x2="50" y2="60" stroke={style.accent} strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="90" y1="85" x2="50" y2="60" stroke={style.accent} strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>
        );
      case "d6":
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
            <rect x="8" y="8" width="84" height="84" rx="14" fill="none" stroke={style.accent} strokeWidth="2.5" />
            <rect x="18" y="18" width="64" height="64" rx="8" fill="none" stroke={style.accent} strokeWidth="1" strokeDasharray="4 3" />
          </svg>
        );
      case "d8":
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <polygon points="50,8 92,50 50,92 8,50" fill="none" stroke={style.accent} strokeWidth="3" />
            <line x1="50" y1="8" x2="50" y2="92" stroke={style.accent} strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="8" y1="50" x2="92" y2="50" stroke={style.accent} strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>
        );
      case "d10":
      case "d100":
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <polygon points="50,6 92,38 76,92 24,92 8,38" fill="none" stroke={style.accent} strokeWidth="3" />
            <line x1="50" y1="6" x2="50" y2="55" stroke={style.accent} strokeWidth="1.5" />
            <line x1="8" y1="38" x2="50" y2="55" stroke={style.accent} strokeWidth="1.5" />
            <line x1="92" y1="38" x2="50" y2="55" stroke={style.accent} strokeWidth="1.5" />
          </svg>
        );
      case "d12":
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none opacity-35">
            <polygon points="50,8 90,37 75,88 25,88 10,37" fill="none" stroke={style.accent} strokeWidth="2.5" />
            <circle cx="50" cy="52" r="26" fill="none" stroke={style.accent} strokeWidth="1" strokeDasharray="3 3" />
          </svg>
        );
      case "d20":
      default:
        return (
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <polygon points="50,6 92,30 92,72 50,96 8,72 8,30" fill="none" stroke={style.accent} strokeWidth="2.5" />
            <polygon points="50,22 80,70 20,70" fill="none" stroke={style.accent} strokeWidth="1.5" />
            <line x1="50" y1="6" x2="50" y2="22" stroke={style.accent} strokeWidth="1.5" />
            <line x1="8" y1="30" x2="20" y2="70" stroke={style.accent} strokeWidth="1.5" />
            <line x1="92" y1="30" x2="80" y2="70" stroke={style.accent} strokeWidth="1.5" />
            <line x1="50" y1="96" x2="20" y2="70" stroke={style.accent} strokeWidth="1.5" />
            <line x1="50" y1="96" x2="80" y2="70" stroke={style.accent} strokeWidth="1.5" />
          </svg>
        );
    }
  };

  return (
    <div
      onClick={onRerollSingle}
      title={onRerollSingle ? "Clique para rolar novamente este dado" : undefined}
      style={{
        transform: isRolling
          ? `perspective(600px) rotateX(${randomOffset.rotX * 6}deg) rotateY(${randomOffset.rotY * 8}deg) rotateZ(${randomOffset.rotZ * 5}deg) scale(1.15) translateY(-14px)`
          : `perspective(600px) rotateX(${randomOffset.rotX * 0.2}deg) rotateY(${randomOffset.rotY * 0.2}deg) rotateZ(${randomOffset.rotZ * 0.2}deg) scale(1)`,
        transition: isRolling ? "none" : "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
      className={`relative group select-none cursor-pointer flex flex-col items-center justify-center ${
        isRolling ? "animate-dice-tumble" : ""
      }`}
    >
      {/* 3D Die Container */}
      <div
        className={`w-18 h-18 sm:w-20 sm:h-20 rounded-2xl ${style.bg} border-2 ${style.border} ${style.glow} flex flex-col items-center justify-center p-2 relative shadow-xl backdrop-blur-xs transition-transform group-hover:scale-105 active:scale-95`}
      >
        {/* Polyhedral Facet SVG */}
        {renderDiceFace()}

        {/* Die Header Label (e.g. d20, d6) */}
        <div className="absolute top-1.5 left-2 font-mono text-[9px] uppercase tracking-wider text-[#8A8270] font-bold z-10 flex items-center gap-0.5">
          <span>{diceType}</span>
        </div>

        {/* Status Badges */}
        {isCrit && !isRolling && (
          <div className="absolute -top-2.5 -right-2 bg-[#FFE599] text-[#15140F] text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5 animate-bounce z-20">
            <Sparkles className="w-2.5 h-2.5 fill-[#15140F]" />
            <span>CRÍTICO!</span>
          </div>
        )}

        {isFumble && !isRolling && (
          <div className="absolute -top-2.5 -right-2 bg-[#FF8A80] text-[#15140F] text-[9px] font-mono font-black px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5 z-20">
            <Skull className="w-2.5 h-2.5" />
            <span>FALHA!</span>
          </div>
        )}

        {isDiscarded && !isRolling && (
          <div className="absolute -bottom-2 bg-[#26231B] text-[#8A8270] border border-[#38352A] text-[8.5px] font-mono px-1 rounded z-20">
            Descartado
          </div>
        )}

        {/* Die Main Number */}
        <div className="relative z-10 flex items-center justify-center my-auto">
          <span
            className={`font-mono text-2xl sm:text-3xl font-black tracking-tight ${style.text} transition-all`}
          >
            {displayValue}
          </span>
        </div>

        {/* Hover Reroll Hint */}
        {onRerollSingle && !isRolling && (
          <div className="absolute bottom-1 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#DFB56C]">
            <RotateCcw className="w-3 h-3" />
          </div>
        )}
      </div>

      {/* Die Reflection / Shadow */}
      <div
        className={`w-12 h-2 rounded-full bg-black/40 blur-[3px] mt-1 transition-all ${
          isRolling ? "scale-75 opacity-30 translate-y-3" : "scale-100 opacity-70"
        }`}
      />
    </div>
  );
};
