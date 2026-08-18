import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BookMarked,
  Dices,
  Send,
  Sparkles,
  Trash2,
  ScrollText,
  AlertCircle,
  HelpCircle,
  Check,
  ShieldCheck,
  Flame,
  Search,
  Database,
  Tag,
  ChevronDown,
  MessageSquare,
  X,
  LogOut,
  User,
  Crown,
  Wand2,
  Sword,
  Shield,
  Moon,
  Skull,
  FileText,
  Printer,
} from "lucide-react";
import { RpgSystem, ChatMessage, ParsedRpgCard, ParsedBlock, KnowledgeEntry, UserProfile, isUserAdmin } from "./types";
import { parseResponseBlocks } from "./utils/cardParser";
import { RpgCard } from "./components/RpgCard";
import { DiceRoller } from "./components/DiceRoller";
import { GrimoireDrawer } from "./components/GrimoireDrawer";
import { QuickPrompts } from "./components/QuickPrompts";
import { KnowledgeBaseModal } from "./components/KnowledgeBaseModal";
import { LoginScreen } from "./components/LoginScreen";
import { UserProfileModal } from "./components/UserProfileModal";
import { DEFAULT_KNOWLEDGE_ENTRIES } from "./data/defaultKnowledge";


const SYSTEMS: RpgSystem[] = [
  "Dungeons & Dragons (D&D)",
  "Pathfinder",
  "Tormenta20 (T20)",
  "Vampiro: A Máscara (Storyteller)",
  "Call of Cthulhu",
  "GURPS",
  "Savage Worlds",
  "Fate Core",
  "Cyberpunk Red",
  "Old Dragon",
  "Outro / não especificar",
];

const SYSTEM_SHORT_LABELS: Record<RpgSystem, { short: string; subtitle: string; icon: string }> = {
  "Dungeons & Dragons (D&D)": { short: "D&D 5e", subtitle: "D20 • Fantasia Medieval", icon: "⚔️" },
  "Pathfinder": { short: "Pathfinder 2e", subtitle: "3 Ações • Tático", icon: "🛡️" },
  "Tormenta20 (T20)": { short: "Tormenta20", subtitle: "Arton • Pontos de Mana", icon: "⚡" },
  "Vampiro: A Máscara (Storyteller)": { short: "Vampiro V5", subtitle: "Storyteller • Fome", icon: "🦇" },
  "Call of Cthulhu": { short: "Call of Cthulhu 7e", subtitle: "D100 • Sanidade", icon: "🐙" },
  "GURPS": { short: "GURPS 4e", subtitle: "3d6 • Modular", icon: "🎯" },
  "Savage Worlds": { short: "Savage Worlds", subtitle: "Dado Selvagem", icon: "🎲" },
  "Fate Core": { short: "Fate Core", subtitle: "Fudge • Aspectos", icon: "🔮" },
  "Cyberpunk Red": { short: "Cyberpunk RED", subtitle: "1d10 • Ciberimplantes", icon: "🤖" },
  "Old Dragon": { short: "Old Dragon 2e", subtitle: "Old School D20", icon: "🐉" },
  "Outro / não especificar": { short: "Outro / Homebrew", subtitle: "Regras Livres", icon: "✨" },
};

const INITIAL_WELCOME = `Saudações, aventureiro! Sou o **Mestre Arcano**, seu códice vivo e oráculo de regras para RPGs de mesa. 

Consulte qualquer mecânica, classe, atributo, magia, sanidade, ciberimplante, façanha ou regra da casa nos mais variados sistemas (D&D, Pathfinder, Tormenta20, Vampiro, Call of Cthulhu, GURPS, Savage Worlds, Fate, Cyberpunk Red, Old Dragon).

**Exemplos de consulta rápida:**
- *"Me fala sobre a classe Bárbaro no D&D"*
- *"Como funciona o teste de Sanidade no Call of Cthulhu?"*
- *"Explique a mecânica de Dados Selvagens e Benas no Savage Worlds"*
- *"Aspectos e Pontos de Destino no Fate Core"*
- *"Cyberpsicose e cálculo de STAT + SKILL + 1d10 no Cyberpunk Red"*
- *"Sistema de 3 ações no Pathfinder vs Ações no D&D"*
- *"Regras de Moral e testes rolando abaixo no Old Dragon"*`;

export default function App() {
  const [activeSystem, setActiveSystem] = useState<RpgSystem>(() => {
    const saved = localStorage.getItem("mestre_arcano_system");
    if (saved && SYSTEMS.includes(saved as RpgSystem)) {
      return saved as RpgSystem;
    }
    return "Dungeons & Dragons (D&D)";
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading chat history:", e);
    }
    return [
      {
        id: "msg-init-welcome",
        role: "assistant",
        content: INITIAL_WELCOME,
        timestamp: Date.now(),
        blocks: parseResponseBlocks(INITIAL_WELCOME),
      },
    ];
  });

  const [savedCards, setSavedCards] = useState<ParsedRpgCard[]>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_grimoire");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error loading grimoire:", e);
    }
    return [];
  });

  const [customKnowledge, setCustomKnowledge] = useState<KnowledgeEntry[]>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_custom_knowledge");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading custom knowledge base:", e);
    }
    return DEFAULT_KNOWLEDGE_ENTRIES;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_current_user");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error loading user profile", e);
    }
    return null;
  });

  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDiceOpen, setIsDiceOpen] = useState(false);
  const [isGrimoireOpen, setIsGrimoireOpen] = useState(false);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
  const [isMobileSystemOpen, setIsMobileSystemOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem("mestre_arcano_system", activeSystem);
  }, [activeSystem]);

  useEffect(() => {
    try {
      localStorage.setItem("mestre_arcano_chat_history", JSON.stringify(messages));
    } catch (e) {
      console.error("Error saving chat history", e);
    }
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("mestre_arcano_grimoire", JSON.stringify(savedCards));
    } catch (e) {
      console.error("Error saving grimoire", e);
    }
  }, [savedCards]);

  useEffect(() => {
    try {
      localStorage.setItem("mestre_arcano_custom_knowledge", JSON.stringify(customKnowledge));
    } catch (e) {
      console.error("Error saving custom knowledge base", e);
    }
  }, [customKnowledge]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleToggleBookmark = (card: ParsedRpgCard) => {
    setSavedCards((prev) => {
      const exists = prev.some((c) => c.name.toLowerCase() === card.name.toLowerCase() && c.systemEd === card.systemEd);
      if (exists) {
        return prev.filter((c) => !(c.name.toLowerCase() === card.name.toLowerCase() && c.systemEd === card.systemEd));
      } else {
        return [card, ...prev];
      }
    });
  };

  const isCardBookmarked = (card: ParsedRpgCard) => {
    return savedCards.some(
      (c) => c.name.toLowerCase() === card.name.toLowerCase() && c.systemEd === card.systemEd
    );
  };

  // Custom Knowledge Base Handlers
  const handleSaveKnowledgeEntry = (entryToSave: KnowledgeEntry) => {
    setCustomKnowledge((prev) => {
      const exists = prev.some((e) => e.id === entryToSave.id);
      if (exists) {
        return prev.map((e) => (e.id === entryToSave.id ? entryToSave : e));
      }
      return [entryToSave, ...prev];
    });
  };

  const handleDeleteKnowledgeEntry = (id: string) => {
    setCustomKnowledge((prev) => prev.filter((e) => e.id !== id));
  };

  const handleToggleKnowledgeEntry = (id: string) => {
    setCustomKnowledge((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e))
    );
  };

  const handleResetKnowledgeDefaults = () => {
    setCustomKnowledge(DEFAULT_KNOWLEDGE_ENTRIES);
  };

  const handleExportKnowledgeJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customKnowledge, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mestre_arcano_banco_regras_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportKnowledgeJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Validate items
        const sanitized: KnowledgeEntry[] = parsed.map((item, idx) => ({
          id: item.id || `imported-${Date.now()}-${idx}`,
          title: String(item.title || "Regra Importada"),
          system: String(item.system || "Universal / Todos"),
          category: item.category || "Regra da Casa",
          keywords: Array.isArray(item.keywords) ? item.keywords.map(String) : [String(item.title || "")],
          content: String(item.content || ""),
          isActive: item.isActive !== false,
          createdAt: Number(item.createdAt) || Date.now(),
          updatedAt: Number(item.updatedAt) || Date.now(),
        }));
        setCustomKnowledge(sanitized);
        return true;
      }
    } catch (e) {
      console.error("Erro ao importar JSON:", e);
    }
    return false;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query,
      timestamp: Date.now(),
      activeSystem,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      // Build conversation history for API
      const historyPayload = messages
        .filter((m) => !m.isError)
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          activeSystem,
          customKnowledge: customKnowledge.filter((e) => e.isActive),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro HTTP ${res.status}`);
      }

      const data = await res.json();
      const responseContent = data.text || "Nenhuma informação retornada pelos arquivos.";
      const blocks = parseResponseBlocks(responseContent);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: responseContent,
        timestamp: Date.now(),
        activeSystem,
        blocks,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Erro ao consultar o Mestre Arcano:", err);
      const isAbort = err?.name === "AbortError";
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: isAbort
          ? "A consulta demorou mais que o esperado. Clique em um dos tópicos rápidos ou tente novamente."
          : `Houve uma oscilação na conexão com a enciclopédia arcana (${err?.message || "Erro de rede"}).`,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
      inputRef.current?.focus();
    }
  };


  const handleCancelRequest = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Deseja realmente limpar o histórico da conversa atual?")) {
      const resetMsg: ChatMessage = {
        id: `init-${Date.now()}`,
        role: "assistant",
        content: INITIAL_WELCOME,
        timestamp: Date.now(),
        blocks: parseResponseBlocks(INITIAL_WELCOME),
      };
      setMessages([resetMsg]);
    }
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("mestre_arcano_current_user", JSON.stringify(user));
    } catch (e) {
      console.error("Error saving current user", e);
    }
    if (user.favoriteSystem) {
      setActiveSystem(user.favoriteSystem);
    }
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    setIsGrimoireOpen(false);
    setIsKnowledgeOpen(false);
    setIsDiceOpen(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem("mestre_arcano_current_user");
    } catch (e) {
      console.error("Erro ao limpar dados do usuário", e);
    }
  };

  const handleGenerateReport = () => {
    const reportData = {
      title: `Relatório de Sessão & Consulta Arcana — ${activeSystem}`,
      date: new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      system: activeSystem,
      user: currentUser?.name || "Mestre / Jogador",
      role: currentUser?.role || "Mestre da Mesa",
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      })),
      grimoireCards: savedCards,
      customRulesCount: customKnowledge.filter((k) => k.isActive).length,
      generatedAt: Date.now(),
    };

    try {
      // Direct save to localStorage - eliminates any POST 405 error on static/Vercel hosting
      localStorage.setItem("relatorio_data", JSON.stringify(reportData));
      localStorage.setItem("mestre_arcano_relatorio", JSON.stringify(reportData));
    } catch (err) {
      console.error("Erro ao salvar dados do relatório no localStorage:", err);
    }

    // Open clean GET route /relatorio in new tab
    window.open("/relatorio", "_blank");
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setCurrentUser(updated);
    try {
      localStorage.setItem("mestre_arcano_current_user", JSON.stringify(updated));
    } catch (e) {
      console.error("Error updating user profile", e);
    }
    if (updated.favoriteSystem && updated.favoriteSystem !== activeSystem) {
      setActiveSystem(updated.favoriteSystem);
    }
  };

  const getAvatarIconComponent = (avatarId?: string) => {
    switch (avatarId) {
      case "master":
        return Crown;
      case "warrior":
        return Sword;
      case "cleric":
        return Shield;
      case "rogue":
        return Moon;
      case "warlock":
        return Skull;
      case "wizard":
      default:
        return Wand2;
    }
  };

  // If no user is logged in, present the Login / Register screen
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Admin authorization status
  const isCurrentUserAdmin = isUserAdmin(currentUser);

  // Filter messages by in-session search query if active
  const displayedMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  // Compute recent queries from user messages for the High Density sidebar
  const recentQueries = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .slice(-4)
    .reverse();

  const lastUserQuery = messages
    .slice()
    .reverse()
    .find((m) => m.role === "user")?.content;

  return (
    <div id="mestre-arcano-app" className="flex h-screen w-full bg-[#15140F] text-[#EFE8D8] overflow-hidden font-sans">
      {/* ================= SIDEBAR (DESKTOP) - HIGH DENSITY ================= */}
      <aside
        id="sidebar"
        className="hidden md:flex flex-col w-[240px] flex-shrink-0 border-r border-[#38352A] bg-[#1D1B14] overflow-y-auto select-none"
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-[#38352A]">
          <div className="text-2xl font-serif font-bold text-white mb-1 flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-[#B08635]" />
            <span>Mestre Arcano</span>
          </div>
          <div className="text-[10px] tracking-[0.2em] uppercase text-[#8DAE8F] font-mono">
            Códice de Regras
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex-1 p-4 flex flex-col gap-6">
          {/* Active System Section */}
          <div>
            <div className="text-[10px] tracking-widest uppercase text-[#A79C82] mb-3 font-mono">
              Sistema Ativo
            </div>
            <div className="flex flex-col gap-1" id="chip-list-desktop">
              {SYSTEMS.map((sys) => {
                const isActive = sys === activeSystem;
                const info = SYSTEM_SHORT_LABELS[sys] || { short: sys, icon: "⚔️" };
                return (
                  <button
                    key={sys}
                    id={`btn-system-${sys.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                    onClick={() => setActiveSystem(sys)}
                    className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between cursor-pointer active:scale-98 ${
                      isActive
                        ? "bg-[#DFB56C]/15 border border-[#DFB56C]/60 text-[#F3EFE6] font-semibold"
                        : "border border-transparent text-[#8A8270] hover:text-[#EFE8D8] hover:bg-[#25231B]"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className="text-xs">{info.icon}</span>
                      <span className="truncate">{info.short}</span>
                    </span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#DFB56C]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Tools */}
          <div>
            <div className="text-[10px] tracking-widest uppercase text-[#A79C82] mb-3 font-mono flex items-center justify-between">
              <span>Ferramentas da Mesa</span>
              {isCurrentUserAdmin && (
                <span className="text-[#8DAE8F] text-[9px] font-mono">
                  {customKnowledge.filter((e) => e.isActive).length} ativas
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {/* Database button - strictly restricted to Admins */}
              {isCurrentUserAdmin && (
                <button
                  onClick={() => setIsKnowledgeOpen(true)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-[#15140F] hover:bg-[#25231B] border border-[#DFB56C]/40 hover:border-[#DFB56C] rounded-md text-xs text-[#EFE8D8] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#DFB56C] group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Banco de Dados</span>
                    <span className="text-[9px] font-mono text-[#DFB56C] bg-[#DFB56C]/10 px-1 py-0.2 rounded border border-[#DFB56C]/30">ADM</span>
                  </div>
                  <span className="font-mono text-[10px] bg-[#4B6B4E]/30 text-[#8DAE8F] border border-[#4B6B4E]/40 px-1.5 py-0.5 rounded">
                    {customKnowledge.length}
                  </span>
                </button>
              )}

              <button
                onClick={() => setIsGrimoireOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] rounded-md text-xs text-[#EFE8D8] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-[#B08635]" />
                  <span>Grimório</span>
                </div>
                <span className="font-mono text-[10px] bg-[#B08635]/20 text-[#DFB56C] px-1.5 py-0.5 rounded">
                  {savedCards.length}
                </span>
              </button>

              <button
                onClick={() => setIsDiceOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#C4645A] rounded-md text-xs text-[#EFE8D8] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Dices className="w-4 h-4 text-[#C4645A]" />
                  <span>Rolador de Dados</span>
                </div>
                <span className="font-mono text-[10px] text-[#A79C82]">d4-d100</span>
              </button>

              {/* Gerar Relatório (localStorage based without POST) */}
              <button
                onClick={handleGenerateReport}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] rounded-md text-xs text-[#EFE8D8] transition-colors group cursor-pointer"
                title="Gera o relatório da sessão e abre em uma nova aba via localStorage"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#DFB56C] group-hover:scale-110 transition-transform" />
                  <span>Gerar Relatório</span>
                </div>
                <span className="font-mono text-[10px] text-[#A79C82] group-hover:text-[#DFB56C]">Aba</span>
              </button>
            </div>
          </div>

          {/* Recent History / Queries in Sidebar */}
          {recentQueries.length > 0 && (
            <div>
              <div className="text-[10px] tracking-widest uppercase text-[#A79C82] mb-3 font-mono">
                Histórico Recente
              </div>
              <ul className="text-sm text-[#A79C82] flex flex-col gap-2 font-sans">
                {recentQueries.map((q, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      setInputText(q);
                      handleSendMessage(q);
                    }}
                    className="hover:text-white cursor-pointer px-1 truncate transition-colors text-xs flex items-center gap-1.5"
                    title={q}
                  >
                    <span className="text-[#8DAE8F]">•</span>
                    <span className="truncate">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* User Profile in Sidebar Footer */}
        <div className="p-3 border-t border-[#38352A] bg-[#15140F]/80 flex items-center gap-2">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex-1 flex items-center justify-between p-2 rounded-xl bg-[#1D1B14] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C]/60 transition-all text-left group cursor-pointer min-w-0"
            title="Abrir Perfil"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#7A2E27]/30 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C] shrink-0">
                {React.createElement(getAvatarIconComponent(currentUser.avatar), { className: "w-4 h-4" })}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-serif font-bold text-[#EFE8D8] truncate flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  {isCurrentUserAdmin && (
                    <span className="text-[9px] font-mono text-[#DFB56C] bg-[#DFB56C]/20 px-1 rounded">ADM</span>
                  )}
                  {currentUser.isGuest && (
                    <span className="text-[9px] font-mono text-[#A79C82]">(Convidado)</span>
                  )}
                </div>
                <div className="text-[10px] font-mono text-[#8DAE8F] truncate">
                  {currentUser.role}
                </div>
              </div>
            </div>
            <div className="text-[#A79C82] group-hover:text-[#EFE8D8] p-1" title="Ver Perfil">
              <User className="w-3.5 h-3.5" />
            </div>
          </button>

          <button
            onClick={handleLogout}
            title="Desconectar e voltar para tela de login"
            className="p-2.5 bg-[#1D1B14] hover:bg-[#7A2E27]/30 border border-[#38352A] hover:border-[#7A2E27] text-[#A79C82] hover:text-[#C4645A] rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT VIEWPORT ================= */}
      <main id="main" className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative bg-[#14130E]">
        {/* Topbar Header - Minimalist, Summarized & Clean */}
        <header
          id="topbar"
          className="h-14 border-b border-[#2B2820] bg-[#171510]/95 backdrop-blur-md shrink-0 z-10 flex items-center justify-between px-3 sm:px-6"
        >
          {/* Left: Brand & Compact Summarized System Selector */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-[#DFB56C]" />
              <span className="font-serif font-bold text-base text-[#F3EFE6] tracking-tight">Mestre Arcano</span>
            </div>

            {/* Summarized System Dropdown Trigger */}
            <button
              onClick={() => setIsMobileSystemOpen(true)}
              title="Trocar Sistema de RPG"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] hover:border-[#DFB56C]/50 text-[#DFB56C] text-xs font-mono rounded-lg active:scale-95 transition-all cursor-pointer shadow-xs"
            >
              <span>{SYSTEM_SHORT_LABELS[activeSystem]?.icon || "⚔️"}</span>
              <span className="font-semibold truncate max-w-[130px] sm:max-w-[200px]">
                {SYSTEM_SHORT_LABELS[activeSystem]?.short || activeSystem.split(" (")[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-[#8A8270]" />
            </button>
          </div>

          {/* Right: Clean Action Controls */}
          <div className="flex items-center gap-1.5">
            {/* Separate Dice Roller Button */}
            <button
              onClick={() => setIsDiceOpen(true)}
              title="Abrir Rolador de Dados (Separado)"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] hover:border-[#C4645A]/60 text-[#D6CEBE] hover:text-[#EFE8D8] text-xs font-mono rounded-lg transition-colors"
            >
              <Dices className="w-3.5 h-3.5 text-[#C4645A]" />
              <span className="hidden md:inline">Rolar Dados</span>
            </button>

            {/* Grimoire Button */}
            <button
              onClick={() => setIsGrimoireOpen(true)}
              title="Grimório de Fichas Salvas"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] hover:border-[#DFB56C]/60 text-[#D6CEBE] text-xs font-mono rounded-lg transition-colors"
            >
              <BookMarked className="w-3.5 h-3.5 text-[#DFB56C]" />
              <span>Grimório</span>
              {savedCards.length > 0 && (
                <span className="bg-[#B08635]/30 text-[#DFB56C] text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-[#B08635]/40">
                  {savedCards.length}
                </span>
              )}
            </button>

            {/* Report Button */}
            <button
              onClick={handleGenerateReport}
              title="Gerar Relatório de Sessão (Nova Aba)"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] hover:border-[#DFB56C]/60 text-[#DFB56C] text-xs font-mono rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#DFB56C]" />
              <span className="hidden sm:inline">Relatório</span>
            </button>

            {/* Search Button */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              title="Buscar no chat"
              className={`p-1.5 rounded-lg border transition-colors ${
                showSearch
                  ? "bg-[#4B6B4E]/20 text-[#8DAE8F] border-[#4B6B4E]/60"
                  : "bg-[#1F1D16] text-[#8A8270] border-[#38352A] hover:text-[#D6CEBE] hover:bg-[#2A271E]"
              }`}
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* Clear Chat */}
            <button
              onClick={handleClearChat}
              title="Limpar Conversa"
              className="p-1.5 bg-[#1F1D16] hover:bg-[#7A2E27]/20 border border-[#38352A] hover:border-[#7A2E27]/60 text-[#8A8270] hover:text-[#C4645A] rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* Search Bar filter */}
        {showSearch && (
          <div className="px-4 py-2 bg-[#171510] border-b border-[#2B2820] flex items-center gap-2 max-w-3xl mx-auto w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar histórico..."
              className="w-full bg-[#14130E] border border-[#38352A] rounded-lg px-3 py-1.5 text-xs text-[#EFE8D8] focus:outline-none focus:border-[#8DAE8F]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-[#A79C82] hover:text-[#EFE8D8] whitespace-nowrap"
              >
                Limpar
              </button>
            )}
          </div>
        )}

        {/* ================= MESSAGES CONTAINER (CLAUDE STYLE) ================= */}
        <div
          id="messages"
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto w-full space-y-6 sm:space-y-8">
            {displayedMessages.map((msg) => (
              <div key={msg.id} className="w-full">
                {msg.role === "user" ? (
                  /* User Bubble - Claude style right-aligned pill */
                  <div className="flex justify-end w-full">
                    <div className="max-w-[88%] sm:max-w-[78%] bg-[#222019] border border-[#3A362C]/70 text-[#F3EFE6] px-4 py-3 rounded-2xl rounded-tr-sm text-[14.5px] leading-relaxed shadow-xs font-sans">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#8E8675] mb-1 uppercase tracking-wider">
                        <span>Você</span>
                        {msg.activeSystem && <span>• {msg.activeSystem}</span>}
                      </div>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ) : (
                  /* Assistant Block - Claude style seamless flow */
                  <div className="w-full space-y-3">
                    {/* Speaker Header */}
                    <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-[#DFB56C]">
                      <Sparkles className="w-3.5 h-3.5 text-[#DFB56C]" />
                      <span>Mestre Arcano</span>
                      {msg.activeSystem && (
                        <span className="text-[#8A8270] font-normal text-[10px]">
                          ({msg.activeSystem})
                        </span>
                      )}
                    </div>

                    {/* Content Rendering */}
                    {msg.isError ? (
                      <div className="bg-[#7A2E27]/15 border border-[#7A2E27]/40 rounded-xl p-4 text-xs text-[#F3E8E4] flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-[#C4645A] font-semibold">
                          <AlertCircle className="w-4 h-4" />
                          <span>Aviso dos Arquivos Arcanos</span>
                        </div>
                        <p className="leading-relaxed">{msg.content}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const lastUser = messages.slice().reverse().find((m) => m.role === "user");
                              if (lastUser) handleSendMessage(lastUser.content);
                            }}
                            className="px-3 py-1.5 bg-[#7A2E27] hover:bg-[#8F392F] text-white rounded-lg text-xs font-medium transition-colors"
                          >
                            Tentar Novamente
                          </button>
                        </div>
                      </div>
                    ) : msg.id === "msg-init-welcome" ? (
                      /* Initial Welcome - Clean Hero & Topic Cards */
                      <div className="space-y-5 pt-2">
                        {/* Welcome Hero Statement */}
                        <div className="space-y-2">
                          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F3EFE6] tracking-tight">
                            Como posso guiar sua mesa de {activeSystem.split(" (")[0]}?
                          </h1>
                          <p className="text-sm text-[#A79C82] leading-relaxed max-w-xl">
                            Consulte mecânicas, magias, combate, atributos, vantagens e regras oficiais. Selecione qualquer sistema acima para alternar as consultas.
                          </p>
                        </div>

                        {/* Interactive Prompt Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                          {[
                            {
                              system: "D&D 5e",
                              title: "Bárbaro e Fúria",
                              desc: "Como funciona a Fúria, dano extra e resistências no D&D 5e?",
                              query: "Me fala sobre a classe Bárbaro no D&D 5e e como funciona a Fúria",
                            },
                            {
                              system: "Pathfinder 2e",
                              title: "Regra de 3 Ações",
                              desc: "Como funcionam as 3 ações e penalidade de ataque múltiplo?",
                              query: "Como funciona a regra de 3 ações e a penalidade de ataque múltiplo no Pathfinder 2e?",
                            },
                            {
                              system: "Tormenta20",
                              title: "Poderes da Tormenta",
                              desc: "Regras de Lefou, perda de Carisma e acumular poderes da Tormenta.",
                              query: "Explique como funcionam os Poderes da Tormenta e a raça Lefou no Tormenta20",
                            },
                            {
                              system: "Call of Cthulhu",
                              title: "Sanidade & Loucura",
                              desc: "Como funcionam os testes de Sanidade, Perda e Loucura Temporária?",
                              query: "Como funciona a mecânica de Sanidade e perda de sanidade no Call of Cthulhu 7e?",
                            },
                          ].map((item, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setInputText(item.query);
                                handleSendMessage(item.query);
                              }}
                              className="group text-left p-3.5 bg-[#1A1813] hover:bg-[#232018] border border-[#2D2A21] hover:border-[#DFB56C]/40 rounded-xl transition-all flex flex-col justify-between gap-1.5 active:scale-98"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-serif font-semibold text-sm text-[#F3EFE6] group-hover:text-[#DFB56C] transition-colors">
                                  {item.title}
                                </span>
                                <span className="text-[10px] font-mono text-[#8A8270] bg-[#14130E] px-1.5 py-0.5 rounded border border-[#2D2A21]">
                                  {item.system}
                                </span>
                              </div>
                              <p className="text-xs text-[#A79C82] leading-snug">
                                {item.desc}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : msg.blocks && msg.blocks.length > 0 ? (
                      msg.blocks.map((block, bIdx) => {
                        if (block.type === "card") {
                          return (
                            <div key={bIdx} className="my-2">
                              <RpgCard
                                card={block.card}
                                isBookmarked={isCardBookmarked(block.card)}
                                onToggleBookmark={handleToggleBookmark}
                                onAskFollowUp={handleSendMessage}
                              />
                            </div>
                          );
                        }

                        if (block.type === "table") {
                          return (
                            <div
                              key={bIdx}
                              className="overflow-x-auto my-3 rounded-xl border border-[#2D2A21] bg-[#171510] p-4 text-xs"
                            >
                              <div className="font-mono text-[10px] uppercase text-[#8A8270] mb-2 tracking-wider">
                                Tabela Comparativa
                              </div>
                              <div className="prose prose-invert max-w-none text-[#EDE8DD]">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {block.content}
                                </ReactMarkdown>
                              </div>
                            </div>
                          );
                        }

                        if (block.type === "prose") {
                          return (
                            <div
                              key={bIdx}
                              className="text-[14.5px] leading-relaxed text-[#EDE8DD] prose prose-invert prose-stone max-w-none"
                            >
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {block.content}
                              </ReactMarkdown>
                            </div>
                          );
                        }

                        return null;
                      })
                    ) : (
                      /* Fallback Markdown */
                      <div className="text-[14.5px] leading-relaxed text-[#EDE8DD] prose prose-invert prose-stone max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Thinking indicator */}
            {isLoading && (
              <div className="flex items-center justify-between gap-3 text-xs font-mono text-[#A79C82] bg-[#1A1813] border border-[#2D2A21] rounded-xl px-4 py-3 max-w-md">
                <div className="flex items-center gap-2.5">
                  <ScrollText className="w-4 h-4 text-[#DFB56C] animate-spin" />
                  <span>Consultando regras de {activeSystem.split(" (")[0]}...</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#DFB56C] animate-arcane-pulse" />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#DFB56C] animate-arcane-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#DFB56C] animate-arcane-pulse"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleCancelRequest}
                  className="text-[11px] text-[#C4645A] hover:text-[#EFE8D8] underline cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ================= COMPOSER / INPUT BAR (FOCUSED ON CHAT & SYSTEM) ================= */}
        <div
          id="inputbar"
          className="shrink-0 w-full px-3 sm:px-6 pb-20 md:pb-5 pt-2 max-w-3xl mx-auto flex flex-col gap-2"
        >
          {/* Quick Prompts strip */}
          <QuickPrompts
            activeSystem={activeSystem}
            onSelectPrompt={(query) => {
              setInputText(query);
              handleSendMessage(query);
            }}
          />

          {/* Clean Input Form: strictly chat input + system select + send */}
          <form
            id="inputrow"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="bg-[#1C1A14] border border-[#38352A] focus-within:border-[#B08635]/60 focus-within:ring-1 focus-within:ring-[#B08635]/25 rounded-2xl p-2.5 sm:p-3 shadow-lg transition-all flex flex-col gap-2"
          >
            {/* Input field */}
            <input
              id="composer"
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Pergunte ao Mestre Arcano (${activeSystem})...`}
              className="w-full bg-transparent text-[#F3EFE6] placeholder-[#7A7464] text-sm focus:outline-none px-1"
            />

            {/* Bottom tools inside composer */}
            <div className="flex items-center justify-between pt-1 border-t border-[#2B2820]/60">
              <div className="flex items-center gap-1.5">
                {/* System switch button (summarized) */}
                <button
                  type="button"
                  onClick={() => setIsMobileSystemOpen(true)}
                  title="Trocar sistema de RPG"
                  className="text-[11px] font-mono text-[#DFB56C] bg-[#14130E] hover:bg-[#232018] border border-[#2D2A21] hover:border-[#DFB56C]/40 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>{SYSTEM_SHORT_LABELS[activeSystem]?.icon || "⚔️"}</span>
                  <span className="font-medium truncate max-w-[130px] sm:max-w-[180px]">
                    {SYSTEM_SHORT_LABELS[activeSystem]?.short || activeSystem.split(" (")[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[#8A8270]" />
                </button>
              </div>

              {/* Submit Button */}
              <button
                id="sendbtn"
                type="submit"
                disabled={isLoading || !inputText.trim()}
                title="Enviar consulta"
                className="bg-[#7A2E27] hover:bg-[#92372E] text-white p-2 rounded-xl text-xs font-semibold active:scale-95 disabled:bg-[#2A2720] disabled:text-[#5C5648] disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[34px] min-h-[34px] shadow-sm cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Claude-style subtle disclaimer */}
          <p className="text-[10.5px] text-[#706B5D] text-center font-sans">
            Mestre Arcano consulta regras oficiais e homebrews cadastrados. Decisões finais pertencem ao mestre de mesa.
          </p>
        </div>

        {/* ================= FIXED MOBILE BOTTOM NAVIGATION DOCK ================= */}
        <nav
          id="mobile-bottom-dock"
          className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#15140F]/95 backdrop-blur-md border-t border-[#38352A] px-2 py-1.5 flex items-center justify-around"
        >
          <button
            onClick={() => {
              inputRef.current?.focus();
              scrollToBottom();
            }}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 text-[#DFB56C] rounded-lg transition-colors active:scale-95"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-mono font-medium">Oráculo</span>
          </button>

          {/* Database button - strictly restricted to Admins */}
          {isCurrentUserAdmin && (
            <button
              onClick={() => setIsKnowledgeOpen(true)}
              className="flex flex-col items-center gap-0.5 py-1 px-2.5 text-[#8DAE8F] rounded-lg transition-colors active:scale-95 relative"
            >
              <Database className="w-5 h-5" />
              <span className="text-[10px] font-mono font-medium">Regras DB</span>
              {customKnowledge.filter((e) => e.isActive).length > 0 && (
                <span className="absolute top-0 right-1 w-4 h-4 bg-[#4B6B4E] text-[#E9F1E9] text-[9px] font-bold rounded-full flex items-center justify-center border border-[#15140F]">
                  {customKnowledge.filter((e) => e.isActive).length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setIsGrimoireOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 text-[#B08635] rounded-lg transition-colors active:scale-95 relative"
          >
            <BookMarked className="w-5 h-5" />
            <span className="text-[10px] font-mono font-medium">Grimório</span>
            {savedCards.length > 0 && (
              <span className="absolute top-0 right-1 w-4 h-4 bg-[#B08635] text-[#15140F] text-[9px] font-bold rounded-full flex items-center justify-center border border-[#15140F]">
                {savedCards.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsDiceOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 text-[#C4645A] rounded-lg transition-colors active:scale-95"
          >
            <Dices className="w-5 h-5" />
            <span className="text-[10px] font-mono font-medium">Dados</span>
          </button>

          {/* Relatório Button */}
          <button
            onClick={handleGenerateReport}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 text-[#DFB56C] rounded-lg transition-colors active:scale-95"
            title="Gerar Relatório de Sessão"
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-mono font-medium">Relatório</span>
          </button>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-2.5 text-[#DFB56C] rounded-lg transition-colors active:scale-95"
          >
            <div className="w-5 h-5 flex items-center justify-center">
              {React.createElement(getAvatarIconComponent(currentUser.avatar), { className: "w-4.5 h-4.5" })}
            </div>
            <span className="text-[10px] font-mono font-medium">Perfil</span>
          </button>
        </nav>
      </main>

      {/* ================= SYSTEM PICKER MODAL (RESPONSIVE & SUMMARIZED) ================= */}
      {isMobileSystemOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-[#1C1A14] border border-[#38352A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2D2A21] bg-[#171510]">
              <div className="flex items-center gap-2.5">
                <ScrollText className="w-5 h-5 text-[#DFB56C]" />
                <div>
                  <h3 className="font-serif font-bold text-base text-[#F3EFE6]">Sistemas de RPG</h3>
                  <p className="text-[11px] text-[#8A8270]">Selecione o sistema para calibrar as respostas do Mestre Arcano</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileSystemOpen(false)}
                className="p-1.5 text-[#8A8270] hover:text-[#F3EFE6] bg-[#14130E] hover:bg-[#25231B] border border-[#2D2A21] rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summarized Grid */}
            <div className="p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {SYSTEMS.map((sys) => {
                const isSelected = activeSystem === sys;
                const info = SYSTEM_SHORT_LABELS[sys] || { short: sys, subtitle: "", icon: "⚔️" };
                return (
                  <button
                    key={sys}
                    onClick={() => {
                      setActiveSystem(sys);
                      setIsMobileSystemOpen(false);
                    }}
                    className={`p-3 rounded-xl text-left transition-all flex items-center justify-between gap-2.5 cursor-pointer active:scale-98 border ${
                      isSelected
                        ? "bg-[#B08635]/20 border-[#DFB56C] shadow-xs"
                        : "bg-[#14130E] hover:bg-[#232018] border-[#2D2A21] hover:border-[#DFB56C]/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{info.icon}</span>
                      <div className="min-w-0">
                        <div className="font-serif font-bold text-sm text-[#F3EFE6] truncate flex items-center gap-1.5">
                          <span>{info.short}</span>
                        </div>
                        <div className="text-[11px] text-[#8A8270] truncate font-sans">
                          {info.subtitle}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#B08635] text-[#14130E] flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODALS / DRAWERS ================= */}
      <DiceRoller
        isOpen={isDiceOpen}
        onClose={() => setIsDiceOpen(false)}
        onSendToChat={(rollText) => {
          setInputText(rollText);
          handleSendMessage(rollText);
        }}
      />

      <KnowledgeBaseModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
        entries={customKnowledge}
        onSaveEntry={handleSaveKnowledgeEntry}
        onDeleteEntry={handleDeleteKnowledgeEntry}
        onToggleEntry={handleToggleKnowledgeEntry}
        onResetDefaults={handleResetKnowledgeDefaults}
        onExportJSON={handleExportKnowledgeJSON}
        onImportJSON={handleImportKnowledgeJSON}
        isAdmin={isCurrentUserAdmin}
        onAskAboutEntry={(title) => {
          setIsKnowledgeOpen(false);
          setInputText(`Explique a regra: ${title}`);
          handleSendMessage(`Explique a regra: ${title}`);
        }}
      />

      <GrimoireDrawer
        isOpen={isGrimoireOpen}
        onClose={() => setIsGrimoireOpen(false)}
        savedCards={savedCards}
        onRemoveCard={(cardId) => {
          setSavedCards((prev) => prev.filter((c) => c.id !== cardId));
        }}
        onClearAll={() => {
          if (window.confirm("Deseja apagar todas as fichas arquivadas no Grimório?")) {
            setSavedCards([]);
          }
        }}
        onAskFollowUp={(prompt) => {
          setIsGrimoireOpen(false);
          setInputText(prompt);
          handleSendMessage(prompt);
        }}
        onOpenDice={() => {
          setIsGrimoireOpen(false);
          setIsDiceOpen(true);
        }}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        onUpdateUser={handleUpdateProfile}
        onLogout={handleLogout}
        savedCardsCount={savedCards.length}
        messagesCount={messages.filter((m) => m.role === "user").length}
        rulesCount={customKnowledge.filter((e) => e.isActive).length}
      />
    </div>
  );
}
