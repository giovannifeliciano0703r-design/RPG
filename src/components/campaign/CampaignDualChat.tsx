import React, { useMemo, useState } from "react";
import {
  Send,
  Dice5,
  Dices,
  Image as ImageIcon,
  User,
  Sparkles,
  Zap,
  ZoomIn,
  MessageSquare,
  Shield,
  Heart,
  ChevronRight,
  Minimize2,
} from "lucide-react";
import {
  ChatMessage,
  ChatChannelType,
  CharacterSheet,
  UserProfile,
  Macro,
} from "../../types";
import { executeMacro } from "../../utils/macroEngine";

interface CampaignDualChatProps {
  messages: ChatMessage[];
  onSendMessage: (msg: Partial<ChatMessage>) => void;
  currentUser: UserProfile;
  characters: CharacterSheet[];
  activeCharacter: CharacterSheet | null;
  onSelectActiveCharacter: (sheet: CharacterSheet | null) => void;
  onOpenMacroManager: () => void;
  onOpenMediaLibrary: () => void;
  onViewHdImage: (url: string, title?: string) => void;
  onToggleCollapse?: () => void;
}

export const CampaignDualChat: React.FC<CampaignDualChatProps> = ({
  messages,
  onSendMessage,
  currentUser,
  characters,
  activeCharacter,
  onSelectActiveCharacter,
  onOpenMacroManager,
  onOpenMediaLibrary,
  onViewHdImage,
  onToggleCollapse,
}) => {
  const [activeChannel, setActiveChannel] = useState<ChatChannelType>("IC");
  const [inputText, setInputText] = useState("");
  const [showDicePicker, setShowDicePicker] = useState(false);

  const filteredMessages = useMemo(
    () => messages.filter((message) => message.channel === activeChannel).slice(-250),
    [activeChannel, messages],
  );

  const handleSend = () => {
    if (!inputText.trim()) return;

    // Check for quick slash commands (e.g. /r 1d20+5)
    if (inputText.startsWith("/r ") || inputText.startsWith("/roll ")) {
      const formula = inputText.replace(/^\/(r|roll)\s+/, "");
      const macroDummy: Macro = {
        id: "quick-roll",
        name: "Rolagem Rápida",
        command: `/roll ${formula}`,
        category: "Utilidades",
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        isShared: false,
        createdAt: Date.now(),
      };
      const result = executeMacro(macroDummy, activeCharacter);

      onSendMessage({
        senderId: currentUser.id,
        senderName: activeChannel === "IC" && activeCharacter ? activeCharacter.name : currentUser.name,
        senderAvatar: activeChannel === "IC" && activeCharacter ? activeCharacter.avatarUrl : currentUser.avatar,
        characterId: activeChannel === "IC" ? activeCharacter?.id : undefined,
        channel: activeChannel,
        content: `Rolou **${formula}**`,
        type: "ROLL",
        rollData: {
          formula,
          total: result.finalTotal,
          rolls: result.diceRolls[0]?.individualRolls || [result.finalTotal],
        },
      });
    } else {
      onSendMessage({
        senderId: currentUser.id,
        senderName: activeChannel === "IC" && activeCharacter ? activeCharacter.name : currentUser.name,
        senderAvatar: activeChannel === "IC" && activeCharacter ? activeCharacter.avatarUrl : currentUser.avatar,
        characterId: activeChannel === "IC" ? activeCharacter?.id : undefined,
        channel: activeChannel,
        content: inputText.trim(),
        type: "TEXT",
      });
    }

    setInputText("");
  };

  const handleQuickDiceRoll = (sides: number) => {
    const roll = Math.floor(Math.random() * sides) + 1;
    onSendMessage({
      senderId: currentUser.id,
      senderName: activeChannel === "IC" && activeCharacter ? activeCharacter.name : currentUser.name,
      senderAvatar: activeChannel === "IC" && activeCharacter ? activeCharacter.avatarUrl : currentUser.avatar,
      characterId: activeChannel === "IC" ? activeCharacter?.id : undefined,
      channel: activeChannel,
      content: `Rolou 1d${sides}`,
      type: "ROLL",
      rollData: {
        formula: `1d${sides}`,
        total: roll,
        rolls: [roll],
      },
    });
    setShowDicePicker(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#12110D] border-l border-[#38352A] overflow-hidden">
      {/* Dual Channel Tabs Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1C1A14] border-b border-[#38352A] shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveChannel("IC")}
            className={`px-3 py-1 rounded-lg font-serif font-bold text-xs transition-colors flex items-center gap-1.5 ${
              activeChannel === "IC"
                ? "bg-[#DFB56C] text-[#15140F]"
                : "bg-[#15140F] text-[#A79C82] hover:text-[#EFE8D8]"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Em Personagem (IC)</span>
          </button>

          <button
            onClick={() => setActiveChannel("OOC")}
            className={`px-3 py-1 rounded-lg font-mono text-xs transition-colors flex items-center gap-1.5 ${
              activeChannel === "OOC"
                ? "bg-[#DFB56C] text-[#15140F] font-bold"
                : "bg-[#15140F] text-[#A79C82] hover:text-[#EFE8D8]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Fora de Jogo (OOC)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#A79C82] hidden lg:inline">
            {activeChannel === "IC" ? "Falas & Ações" : "Chat Geral"}
          </span>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="px-2 py-1 bg-[#15140F] border border-[#38352A] hover:border-[#DFB56C] text-[#A79C82] hover:text-[#DFB56C] rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-mono"
              title="Abreviar / Ocultar Chat da Mesa"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Abreviar</span>
            </button>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredMessages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;

          return (
            <div key={msg.id} className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-[#DFB56C]">{msg.senderName}</span>
                {msg.channel === "IC" && (
                  <span className="text-[9px] font-mono text-[#8DAE8F] bg-[#4B6B4E]/20 px-1 py-0.2 rounded">IC</span>
                )}
                <span className="text-[9px] font-mono text-[#A79C82]">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>

              {/* Message Type rendering */}
              {msg.type === "ROLL" && msg.rollData ? (
                <div className="p-3 bg-[#1C1A14] border border-[#DFB56C]/50 rounded-xl space-y-1.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-[#A79C82] flex items-center gap-1">
                      <Dices className="w-3.5 h-3.5 text-[#DFB56C]" /> {msg.rollData.formula}
                    </span>
                    <span className="font-mono font-bold text-base text-[#DFB56C] bg-[#DFB56C]/10 px-2 py-0.5 rounded-lg border border-[#DFB56C]/30">
                      Total: {msg.rollData.total}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-[#A79C82]">
                    Dados: [{(msg.rollData.rolls || msg.rollData.individualRolls || [msg.rollData.total]).join(", ")}]
                  </p>
                </div>
              ) : msg.type === "IMAGE" && msg.imageUrl ? (
                <div
                  onClick={() => onViewHdImage(msg.imageUrl!, msg.content)}
                  className="relative group rounded-xl overflow-hidden border border-[#38352A] max-w-xs cursor-zoom-in"
                >
                  <img
                    src={msg.imageUrl}
                    alt={msg.content || "Handout"}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover max-h-56"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs text-[#EFE8D8] flex items-center gap-1 bg-[#15140F]/80 px-2 py-1 rounded-lg">
                      <ZoomIn className="w-3.5 h-3.5" /> Ver em Alta Resolução
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-[#1C1A14] border border-[#38352A] rounded-xl text-[#EFE8D8] whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              )}
            </div>
          );
        })}

        {filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-[#A79C82] space-y-1">
            <MessageSquare className="w-8 h-8 text-[#38352A]" />
            <p className="text-xs font-serif text-[#EFE8D8]">Nenhuma mensagem no canal {activeChannel}</p>
            <p className="text-[10px]">Envie uma mensagem ou use /roll 1d20+3 para testar.</p>
          </div>
        )}
      </div>

      {/* Input Area + Character Switcher */}
      <div className="p-3 bg-[#1C1A14] border-t border-[#38352A] space-y-2 shrink-0">
        {/* Character switcher bar if in IC mode */}
        {activeChannel === "IC" && characters.length > 0 && (
          <div className="flex items-center justify-between text-xs bg-[#15140F] border border-[#38352A] px-2.5 py-1 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-[#DFB56C]" />
              <span className="text-[10px] text-[#A79C82]">Falando como:</span>
              <select
                value={activeCharacter?.id || ""}
                onChange={(e) => {
                  const target = characters.find((c) => c.id === e.target.value);
                  onSelectActiveCharacter(target || null);
                }}
                className="bg-transparent text-[#DFB56C] font-serif font-bold text-xs outline-none cursor-pointer"
              >
                {characters.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#15140F] text-[#EFE8D8]">
                    {c.name} ({c.characterClass} Nv.{c.level})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Quick Toolbar */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowDicePicker(!showDicePicker)}
                className="p-1.5 bg-[#15140F] border border-[#38352A] hover:border-[#DFB56C] text-[#DFB56C] rounded-lg flex items-center gap-1"
                title="Rolar Dado Rápido"
              >
                <Dice5 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-mono font-bold">Dados</span>
              </button>

              {/* Dice popup */}
              {showDicePicker && (
                <div className="absolute bottom-10 left-0 bg-[#15140F] border border-[#7A2E27] rounded-xl p-2 shadow-2xl flex gap-1 z-30 animate-in fade-in zoom-in-95">
                  {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
                    <button
                      key={sides}
                      onClick={() => handleQuickDiceRoll(sides)}
                      className="px-2 py-1 bg-[#1C1A14] hover:bg-[#DFB56C] hover:text-[#15140F] border border-[#38352A] text-[10px] font-mono font-bold text-[#EFE8D8] rounded transition-colors"
                    >
                      d{sides}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onOpenMacroManager}
              className="p-1.5 bg-[#15140F] border border-[#38352A] hover:border-[#DFB56C] text-[#DFB56C] rounded-lg flex items-center gap-1"
              title="Abrir Gerenciador de Macros"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[10px] font-mono font-bold">Macros</span>
            </button>

            <button
              onClick={onOpenMediaLibrary}
              className="p-1.5 bg-[#15140F] border border-[#38352A] hover:border-[#DFB56C] text-[#A79C82] hover:text-[#EFE8D8] rounded-lg"
              title="Inserir Imagem / Handout"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Input box */}
        <div className="flex gap-1.5">
          <input
            type="text"
            placeholder={
              activeChannel === "IC"
                ? `Falar como ${activeCharacter?.name || currentUser.name}...`
                : "Mensagem fora de jogo (ou /roll 1d20+5)..."
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            className="flex-1 bg-[#15140F] border border-[#38352A] rounded-xl px-3 py-2 text-xs text-[#EFE8D8] placeholder-[#A79C82] outline-none focus:border-[#DFB56C]"
          />
          <button
            onClick={handleSend}
            className="p-2 bg-[#DFB56C] hover:bg-[#b08635] text-[#15140F] rounded-xl transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
