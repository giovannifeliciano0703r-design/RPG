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
  Users,
  Map as MapIcon,
  Zap,
  Image as ImageIcon,
  Folder,
  Layers,
  Heart,
  Settings,
} from "lucide-react";
import {
  RpgSystem,
  ChatMessage,
  ParsedRpgCard,
  ParsedBlock,
  KnowledgeEntry,
  UserProfile,
  isUserAdmin,
  CharacterSheet,
  MonsterStatBlock,
  Macro,
  MediaAsset,
  NpcFolder,
  NpcEntry,
  Campaign,
  BattleMapData,
  InitiativeState,
} from "./types";
import { parseResponseBlocks } from "./utils/cardParser";
import { RpgCard } from "./components/RpgCard";
import { DiceRoller } from "./components/DiceRoller";
import { GrimoireDrawer } from "./components/GrimoireDrawer";
import { QuickPrompts } from "./components/QuickPrompts";
import { KnowledgeBaseModal } from "./components/KnowledgeBaseModal";
import { LoginScreen } from "./components/LoginScreen";
import { UserProfileModal } from "./components/UserProfileModal";
import { DEFAULT_KNOWLEDGE_ENTRIES } from "./data/defaultKnowledge";
import { DEFAULT_MONSTERS } from "./data/defaultMonsters";
import {
  DEFAULT_CHARACTER,
  DEFAULT_MACROS,
  DEFAULT_NPC_FOLDERS,
  DEFAULT_NPCS,
  DEFAULT_INITIAL_CAMPAIGN,
  DEFAULT_BATTLEMAP,
  DEFAULT_INITIATIVE_STATE,
} from "./data/defaultAppData";

// New Modals for the 8 modules
import { CharacterSheetModal } from "./components/character/CharacterSheetModal";
import { BestiaryModal } from "./components/bestiary/BestiaryModal";
import { MacroManagerModal } from "./components/macros/MacroManagerModal";
import { MediaLibraryModal } from "./components/media/MediaLibraryModal";
import { ImageLightboxModal } from "./components/media/ImageLightboxModal";
import { NpcFoldersModal } from "./components/npc/NpcFoldersModal";
import { CampaignManagerModal } from "./components/campaign/CampaignManagerModal";
import { CampaignDualChat } from "./components/campaign/CampaignDualChat";
import { BattlemapCanvas } from "./components/vtt/BattlemapCanvas";
import { InitiativeTrackerBar } from "./components/vtt/InitiativeTrackerBar";
import { executeMacro } from "./utils/macroEngine";
import { SystemSelectorModal, RPG_SYSTEMS_META } from "./components/SystemSelectorModal";

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

const INITIAL_WELCOME = `Saudações, aventureiro! Sou o **Mestre Arcano**, seu códice vivo, VTT e oráculo de regras para RPGs de mesa. 

Consulte qualquer mecânica, gere fichas inteligentes, navegue pelo Bestiário com dezenas de monstros, execute macros de combate, use o mapa tático interativo com névoa de guerra ou gerencie campanhas multiplayer em tempo real!

**Recursos disponíveis na barra de ferramentas:**
- 📜 **Ficha Inteligente**: Cálculo automático de bônus, magias, perícias e bônus temporários.
- 💀 **Bestiário de Monstros**: Blocos de estatísticas com rolagem direta de ataque e spawn no mapa.
- ⚡ **Macros de Rolagem**: Fórmulas com variáveis automáticas da ficha (@{strMod}, @{profBonus}).
- 🗺️ **Mesa Virtual & Battlemap**: Grade interativa, medição de alcance, névoa e tokens com barra de vida.
- 👑 **Campanhas Multiplayer**: Papéis de GM/Co-GM com permissões granulares e Chat IC/OOC.`;

export default function App() {
  // Current view mode: 'codex' (AI Rules Chat) | 'vtt' (Virtual Tabletop Battlemap + Dual Chat)
  const [activeView, setActiveView] = useState<"codex" | "vtt">("codex");

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

  // Module 1: Character Sheets State
  const [characters, setCharacters] = useState<CharacterSheet[]>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_characters");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [DEFAULT_CHARACTER];
  });
  const [activeCharacter, setActiveCharacter] = useState<CharacterSheet | null>(characters[0] || null);
  const [editingCharacter, setEditingCharacter] = useState<CharacterSheet | null>(null);
  const [isCharacterSheetOpen, setIsCharacterSheetOpen] = useState(false);

  // Module 2: Bestiary State
  const [monsters, setMonsters] = useState<MonsterStatBlock[]>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_monsters");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MONSTERS;
  });
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);

  // Module 3: Macros State
  const [macros, setMacros] = useState<Macro[]>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_macros");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MACROS;
  });
  const [isMacroOpen, setIsMacroOpen] = useState(false);

  // Module 4 & 5: Media Library & Lightbox State
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_media");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);

  // Module 6: NPC Folders State
  const [npcFolders, setNpcFolders] = useState<NpcFolder[]>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_npc_folders");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_NPC_FOLDERS;
  });
  const [npcs, setNpcs] = useState<NpcEntry[]>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_npcs");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_NPCS;
  });
  const [isNpcFoldersOpen, setIsNpcFoldersOpen] = useState(false);

  // Module 7: Multiplayer Campaigns & Dual Chat State
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_campaigns");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [DEFAULT_INITIAL_CAMPAIGN];
  });
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(campaigns[0] || null);
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [campaignMessages, setCampaignMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_campaign_chat");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: "msg-camp-1",
        senderId: "default-gm",
        senderName: "Mestre Arcano (GM)",
        channel: "IC",
        content: "Vocês adentram os portões rangentes das catacumbas. O ar é pesado e tochas crepitam nas paredes de pedra.",
        timestamp: Date.now() - 3600000,
        type: "TEXT",
      },
      {
        id: "msg-camp-2",
        senderId: "default-user",
        senderName: "Eldrin Lua-Negra",
        characterId: "char-eldrin-1",
        channel: "IC",
        content: "Ergo meu cajado e sussurro uma prece luminosa para revelar as sombras ao redor.",
        timestamp: Date.now() - 1800000,
        type: "TEXT",
      },
    ];
  });

  // Module 8: Interactive Battlemap & Initiative Tracker State
  const [battleMapData, setBattleMapData] = useState<BattleMapData>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_battlemap");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_BATTLEMAP;
  });
  const [initiativeState, setInitiativeState] = useState<InitiativeState>(() => {
    try {
      const saved = localStorage.getItem("mestre_arcano_initiative");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_INITIATIVE_STATE;
  });

  // Chat UI controls
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

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("mestre_arcano_system", activeSystem);
  }, [activeSystem]);

  useEffect(() => {
    try {
      localStorage.setItem("mestre_arcano_chat_history", JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem("mestre_arcano_grimoire", JSON.stringify(savedCards));
    } catch (e) {}
  }, [savedCards]);

  useEffect(() => {
    try {
      localStorage.setItem("mestre_arcano_characters", JSON.stringify(characters));
    } catch (e) {}
  }, [characters]);

  useEffect(() => {
    try {
      localStorage.setItem("mestre_arcano_monsters", JSON.stringify(monsters));
    } catch (e) {}
  }, [monsters]);

  useEffect(() => {
    try {
      localStorage.setItem("mestre_arcano_macros", JSON.stringify(macros));
    } catch (e) {}
  }, [macros]);

  useEffect(() => {
    try {
      localStorage.setItem("mestre_arcano_media", JSON.stringify(mediaAssets));
    } catch (e) {}
  }, [mediaAssets]);

  useEffect(() => {
    try {
      localStorage.setItem("mestre_arcano_npc_folders", JSON.stringify(npcFolders));
      localStorage.setItem("mestre_arcano_npcs", JSON.stringify(npcs));
    } catch (e) {}
  }, [npcFolders, npcs]);

  useEffect(() => {
    try {
      localStorage.setItem("mestre_arcano_campaigns", JSON.stringify(campaigns));
      localStorage.setItem("mestre_arcano_campaign_chat", JSON.stringify(campaignMessages));
    } catch (e) {}
  }, [campaigns, campaignMessages]);

  useEffect(() => {
    try {
      localStorage.setItem("mestre_arcano_battlemap", JSON.stringify(battleMapData));
      localStorage.setItem("mestre_arcano_initiative", JSON.stringify(initiativeState));
    } catch (e) {}
  }, [battleMapData, initiativeState]);

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
    return savedCards.some((c) => c.name.toLowerCase() === card.name.toLowerCase() && c.systemEd === card.systemEd);
  };

  // Custom Knowledge Handlers
  const handleSaveKnowledgeEntry = (entryToSave: KnowledgeEntry) => {
    setCustomKnowledge((prev) => {
      const exists = prev.some((e) => e.id === entryToSave.id);
      if (exists) return prev.map((e) => (e.id === entryToSave.id ? entryToSave : e));
      return [entryToSave, ...prev];
    });
  };

  const handleDeleteKnowledgeEntry = (id: string) => {
    setCustomKnowledge((prev) => prev.filter((e) => e.id !== id));
  };

  const handleToggleKnowledgeEntry = (id: string) => {
    setCustomKnowledge((prev) => prev.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e)));
  };

  const handleResetKnowledgeDefaults = () => setCustomKnowledge(DEFAULT_KNOWLEDGE_ENTRIES);

  const handleExportKnowledgeJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customKnowledge, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mestre_arcano_regras_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportKnowledgeJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed) && parsed.length > 0) {
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

  // AI Chat Request Handler
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
      const historyPayload = messages
        .filter((m) => !m.isError)
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

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
    } catch (e) {}
    if (user.favoriteSystem) {
      setActiveSystem(user.favoriteSystem);
    }
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    setIsGrimoireOpen(false);
    setIsKnowledgeOpen(false);
    setIsDiceOpen(false);
    setIsCharacterSheetOpen(false);
    setIsBestiaryOpen(false);
    setIsMacroOpen(false);
    setIsMediaOpen(false);
    setIsNpcFoldersOpen(false);
    setIsCampaignOpen(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem("mestre_arcano_current_user");
    } catch (e) {}
  };

  // Generate Report via localStorage (100% POST 405 error-free)
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
      localStorage.setItem("relatorio_data", JSON.stringify(reportData));
      localStorage.setItem("mestre_arcano_relatorio", JSON.stringify(reportData));
    } catch (err) {
      console.error("Erro ao salvar dados do relatório no localStorage:", err);
    }

    window.open("/relatorio", "_blank");
  };

  const handleUpdateProfile = (updated: UserProfile) => {
    setCurrentUser(updated);
    try {
      localStorage.setItem("mestre_arcano_current_user", JSON.stringify(updated));
    } catch (e) {}
    if (updated.favoriteSystem && updated.favoriteSystem !== activeSystem) {
      setActiveSystem(updated.favoriteSystem);
    }
  };

  // Broadcast roll to Dual Chat & AI Codex
  const handleBroadcastRoll = (label: string, bonus: number) => {
    const roll20 = Math.floor(Math.random() * 20) + 1;
    const total = roll20 + bonus;
    const formulaStr = `1d20 (${roll20}) ${bonus >= 0 ? `+ ${bonus}` : `- ${Math.abs(bonus)}`}`;

    const newCampMsg: ChatMessage = {
      id: `roll-${Date.now()}`,
      senderId: currentUser?.id || "anon",
      senderName: activeCharacter?.name || currentUser?.name || "Aventureiro",
      channel: "IC",
      content: `Rolou **${label}**: **${total}** [${formulaStr}]`,
      timestamp: Date.now(),
      type: "ROLL",
      rollData: {
        formula: `${label} (1d20+${bonus})`,
        total,
        rolls: [roll20],
      },
    };

    setCampaignMessages((prev) => [...prev, newCampMsg]);
  };

  // Execute macro directly and send to Dual Chat
  const handleExecuteMacro = (macro: Macro) => {
    const res = executeMacro(macro, activeCharacter);
    const newCampMsg: ChatMessage = {
      id: `macro-${Date.now()}`,
      senderId: currentUser?.id || "anon",
      senderName: activeCharacter?.name || currentUser?.name || "Aventureiro",
      channel: "IC",
      content: `Executou Macro **${macro.name}**:\n${res.resolvedCommand}`,
      timestamp: Date.now(),
      type: "ROLL",
      rollData: {
        formula: macro.name,
        total: res.finalTotal,
        rolls: res.diceRolls.map((d) => d.total),
      },
    };
    setCampaignMessages((prev) => [...prev, newCampMsg]);
    setIsMacroOpen(false);
  };

  // Spawn monster to Battlemap
  const handleSpawnMonsterToMap = (monster: MonsterStatBlock) => {
    const newToken = {
      id: `token-mon-${Date.now()}`,
      name: monster.name,
      x: 360,
      y: 300,
      size: monster.size === "Grande" ? 2 : monster.size === "Enorme" ? 3 : 1,
      currentHp: monster.hp.average,
      maxHp: monster.hp.average,
      ac: monster.armorClass,
      isEnemy: true,
      isVisibleToPlayers: true,
      conditions: [],
      speed: 9,
    };
    setBattleMapData((prev) => ({ ...prev, tokens: [...prev.tokens, newToken] }));
    setIsBestiaryOpen(false);
    setActiveView("vtt");
  };

  // Spawn NPC to Battlemap
  const handleSpawnNpcToMap = (npc: NpcEntry) => {
    const newToken = {
      id: `token-npc-${Date.now()}`,
      name: npc.name,
      x: 300,
      y: 300,
      size: 1,
      currentHp: 20,
      maxHp: 20,
      ac: 12,
      isEnemy: npc.attitude === "Hostil",
      isVisibleToPlayers: true,
      conditions: [],
      speed: 9,
    };
    setBattleMapData((prev) => ({ ...prev, tokens: [...prev.tokens, newToken] }));
    setIsNpcFoldersOpen(false);
    setActiveView("vtt");
  };

  const getAvatarIconComponent = (avatarKey?: string) => {
    switch (avatarKey) {
      case "Crown":
        return Crown;
      case "Wand":
        return Wand2;
      case "Sword":
        return Sword;
      case "Shield":
        return Shield;
      case "Moon":
        return Moon;
      case "Skull":
        return Skull;
      case "Scroll":
      default:
        return ScrollText;
    }
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isCurrentUserAdmin = isUserAdmin(currentUser);

  const displayedMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const isCurrentGm = activeCampaign?.gmUserId === currentUser.id;
  const currentSystemMeta = RPG_SYSTEMS_META.find((s) => s.id === activeSystem) || RPG_SYSTEMS_META[0];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#14130E] text-[#EFE8D8] font-sans antialiased">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside
        id="sidebar"
        className="hidden md:flex flex-col w-[260px] flex-shrink-0 border-r border-[#38352A] bg-[#1D1B14] overflow-y-auto select-none"
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#38352A] flex items-center justify-between">
          <div>
            <div className="text-xl font-serif font-bold text-white mb-0.5 flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-[#B08635]" />
              <span>Mestre Arcano</span>
            </div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#8DAE8F] font-mono">
              VTT & Códice de Regras
            </div>
          </div>
        </div>

        {/* View Switcher: AI Rules vs VTT Battlemap */}
        <div className="p-3 border-b border-[#38352A] bg-[#15140F]">
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#1C1A14] border border-[#38352A] rounded-xl text-xs font-mono">
            <button
              onClick={() => setActiveView("codex")}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeView === "codex"
                  ? "bg-[#DFB56C] text-[#15140F] font-bold shadow-md"
                  : "text-[#A79C82] hover:text-[#EFE8D8]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Códice</span>
            </button>
            <button
              onClick={() => setActiveView("vtt")}
              className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                activeView === "vtt"
                  ? "bg-[#DFB56C] text-[#15140F] font-bold shadow-md"
                  : "text-[#A79C82] hover:text-[#EFE8D8]"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Mesa VTT</span>
            </button>
          </div>
        </div>

        {/* Navigation & Controls */}
        <div className="flex-1 p-3 flex flex-col gap-4 overflow-y-auto">
          {/* Quick RPG Tools */}
          <div>
            <div className="text-[10px] tracking-widest uppercase text-[#A79C82] mb-2 font-mono flex items-center justify-between">
              <span>Módulos da Mesa</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {/* Module 1: Ficha Inteligente */}
              <button
                onClick={() => {
                  setEditingCharacter(activeCharacter || characters[0]);
                  setIsCharacterSheetOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] rounded-xl text-xs text-[#EFE8D8] transition-colors group cursor-pointer"
                title="Fichas de Personagem com cálculos automáticos"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#DFB56C] group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Ficha do Personagem</span>
                </div>
                <span className="text-[9px] font-mono bg-[#DFB56C]/10 text-[#DFB56C] px-1.5 py-0.5 rounded">
                  Nv.{activeCharacter?.level || 1}
                </span>
              </button>

              {/* Module 2: Bestiário */}
              <button
                onClick={() => setIsBestiaryOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#C4645A] rounded-xl text-xs text-[#EFE8D8] transition-colors group cursor-pointer"
                title="Biblioteca de Monstros e Criaturas"
              >
                <div className="flex items-center gap-2">
                  <Skull className="w-4 h-4 text-[#C4645A] group-hover:scale-110 transition-transform" />
                  <span>Bestiário & Monstros</span>
                </div>
                <span className="text-[9px] font-mono text-[#A79C82]">{monsters.length}</span>
              </button>

              {/* Module 3: Macros */}
              <button
                onClick={() => setIsMacroOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] rounded-xl text-xs text-[#EFE8D8] transition-colors group cursor-pointer"
                title="Macros de rolagem com variáveis automáticas"
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#DFB56C] group-hover:scale-110 transition-transform" />
                  <span>Macros de Rolagem</span>
                </div>
                <span className="text-[9px] font-mono text-[#A79C82]">{macros.length}</span>
              </button>

              {/* Module 4 & 5: Galeria de Mídia */}
              <button
                onClick={() => setIsMediaOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] rounded-xl text-xs text-[#EFE8D8] transition-colors group cursor-pointer"
                title="Armazenamento e compressão WebP de imagens"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-[#7E9FB0] group-hover:scale-110 transition-transform" />
                  <span>Galeria de Mídia</span>
                </div>
                <span className="text-[9px] font-mono text-[#A79C82]">{mediaAssets.length}</span>
              </button>

              {/* Module 6: Pastas de NPCs */}
              <button
                onClick={() => setIsNpcFoldersOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#8DAE8F] rounded-xl text-xs text-[#EFE8D8] transition-colors group cursor-pointer"
                title="Organização de NPCs em pastas com anotações secretas"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#8DAE8F] group-hover:scale-110 transition-transform" />
                  <span>Pastas de NPCs</span>
                </div>
                <span className="text-[9px] font-mono text-[#8DAE8F]">{npcs.length}</span>
              </button>

              {/* Module 7: Campanhas */}
              <button
                onClick={() => setIsCampaignOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] rounded-xl text-xs text-[#EFE8D8] transition-colors group cursor-pointer"
                title="Gerenciamento de campanhas e permissões de Co-GM"
              >
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#DFB56C] group-hover:scale-110 transition-transform" />
                  <span>Campanha Multiplayer</span>
                </div>
                <span className="text-[9px] font-mono text-[#DFB56C]">{campaigns.length}</span>
              </button>
            </div>
          </div>

          {/* Database button - restricted to Admins */}
          {isCurrentUserAdmin && (
            <button
              onClick={() => setIsKnowledgeOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#15140F] hover:bg-[#25231B] border border-[#DFB56C]/40 hover:border-[#DFB56C] rounded-xl text-xs text-[#EFE8D8] transition-colors group"
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

          {/* Active System Section (Compact - Only selected shown) */}
          <div>
            <div className="text-[10px] tracking-widest uppercase text-[#A79C82] mb-2 font-mono flex items-center justify-between">
              <span>Sistema Ativo</span>
              <span className="text-[9px] text-[#DFB56C] font-mono">Alterar</span>
            </div>
            <button
              onClick={() => setIsMobileSystemOpen(true)}
              title="Clique para escolher outro sistema de RPG"
              className="w-full text-left p-2.5 rounded-xl bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C]/70 transition-all cursor-pointer group flex items-center justify-between shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#1D1B14] border border-[#38352A] group-hover:border-[#DFB56C]/50 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                  {currentSystemMeta.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border ${currentSystemMeta.badgeBg}`}>
                      {currentSystemMeta.abbrev}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-[#EFE8D8] truncate group-hover:text-white mt-0.5">
                    {currentSystemMeta.shortName}
                  </div>
                </div>
              </div>
              <div className="p-1 rounded-md bg-[#1D1B14] text-[#8A8270] group-hover:text-[#DFB56C] group-hover:bg-[#DFB56C]/10 transition-colors shrink-0 ml-1">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>

        {/* User Profile in Sidebar Footer */}
        <div className="p-3 border-t border-[#38352A] bg-[#15140F]/80 flex items-center gap-2">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="flex-1 flex items-center justify-between p-2 rounded-xl bg-[#1D1B14] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C]/60 transition-all text-left group cursor-pointer min-w-0"
            title="Abrir Perfil"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#7A2E27]/30 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C] shrink-0">
                {React.createElement(getAvatarIconComponent(currentUser.avatar), { className: "w-3.5 h-3.5" })}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-serif font-bold text-[#EFE8D8] truncate flex items-center gap-1">
                  <span>{currentUser.name}</span>
                  {isCurrentUserAdmin && <span className="text-[9px] font-mono text-[#DFB56C]">ADM</span>}
                </div>
                <div className="text-[9px] font-mono text-[#8DAE8F] truncate">{currentUser.role}</div>
              </div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            title="Desconectar e voltar para tela de login"
            className="p-2 bg-[#1D1B14] hover:bg-[#7A2E27]/30 border border-[#38352A] hover:border-[#7A2E27] text-[#A79C82] hover:text-[#C4645A] rounded-xl transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ================= MAIN VIEWPORT ================= */}
      <main id="main" className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden relative bg-[#14130E]">
        {/* Topbar Header */}
        <header
          id="topbar"
          className="h-14 border-b border-[#2B2820] bg-[#171510]/95 backdrop-blur-md shrink-0 z-10 flex items-center justify-between px-3 sm:px-6"
        >
          {/* Left: View mode toggler & System */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={() => setActiveView(activeView === "codex" ? "vtt" : "codex")}
                className="p-1.5 bg-[#1F1D16] border border-[#38352A] rounded-lg text-xs font-mono text-[#DFB56C] flex items-center gap-1"
              >
                {activeView === "codex" ? <MapIcon className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{activeView === "codex" ? "VTT" : "Códice"}</span>
              </button>
            </div>

            <button
              onClick={() => setIsMobileSystemOpen(true)}
              title="Clique para escolher outro sistema de RPG"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] hover:border-[#DFB56C]/60 text-[#DFB56C] text-xs font-mono rounded-lg active:scale-95 transition-all cursor-pointer shadow-xs group"
            >
              <span>{currentSystemMeta.icon}</span>
              <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${currentSystemMeta.badgeBg}`}>
                {currentSystemMeta.abbrev}
              </span>
              <span className="hidden sm:inline font-medium text-[#D6CEBE] text-xs truncate max-w-[150px]">
                {currentSystemMeta.shortName}
              </span>
              <ChevronDown className="w-3 h-3 text-[#8A8270] group-hover:text-[#DFB56C] transition-colors" />
            </button>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsDiceOpen(true)}
              title="Abrir Rolador de Dados"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] hover:border-[#C4645A]/60 text-[#D6CEBE] hover:text-[#EFE8D8] text-xs font-mono rounded-lg transition-colors"
            >
              <Dices className="w-3.5 h-3.5 text-[#C4645A]" />
              <span className="hidden md:inline">Dados</span>
            </button>

            <button
              onClick={() => {
                setEditingCharacter(activeCharacter || characters[0]);
                setIsCharacterSheetOpen(true);
              }}
              title="Abrir Ficha de Personagem"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] hover:border-[#DFB56C]/60 text-[#DFB56C] text-xs font-mono rounded-lg transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ficha</span>
            </button>

            <button
              onClick={() => setIsGrimoireOpen(true)}
              title="Grimório de Fichas Salvas"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] hover:border-[#DFB56C]/60 text-[#D6CEBE] text-xs font-mono rounded-lg transition-colors"
            >
              <BookMarked className="w-3.5 h-3.5 text-[#DFB56C]" />
              <span>Grimório ({savedCards.length})</span>
            </button>

            <button
              onClick={handleGenerateReport}
              title="Gerar Relatório de Sessão (Nova Aba)"
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] hover:border-[#DFB56C]/60 text-[#DFB56C] text-xs font-mono rounded-lg transition-colors cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#DFB56C]" />
              <span className="hidden sm:inline">Relatório</span>
            </button>
          </div>
        </header>

        {/* View Mode 1: CODEX & AI RULES ENGINE */}
        {activeView === "codex" && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Search Filter Bar */}
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
                  <button onClick={() => setSearchQuery("")} className="text-xs text-[#A79C82] hover:text-[#EFE8D8]">
                    Limpar
                  </button>
                )}
              </div>
            )}

            {/* Messages Stream */}
            <div id="messages" className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth">
              <div className="max-w-3xl mx-auto w-full space-y-6 sm:space-y-8">
                {displayedMessages.map((msg) => (
                  <div key={msg.id} className="w-full">
                    {msg.role === "user" ? (
                      <div className="flex justify-end">
                        <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[#25231B] border border-[#38352A] text-[#EFE8D8] text-sm leading-relaxed shadow-sm">
                          {msg.content}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs text-[#A79C82]">
                          <ScrollText className="w-4 h-4 text-[#DFB56C]" />
                          <span className="font-serif font-bold text-[#EFE8D8]">Mestre Arcano</span>
                          {msg.activeSystem && (
                            <span className="font-mono text-[10px] text-[#DFB56C] bg-[#DFB56C]/10 px-2 py-0.5 rounded">
                              {SYSTEM_SHORT_LABELS[msg.activeSystem]?.short || msg.activeSystem}
                            </span>
                          )}
                        </div>

                        {msg.blocks && msg.blocks.length > 0 ? (
                          msg.blocks.map((b, idx) =>
                            b.type === "card" && b.card ? (
                              <RpgCard
                                key={idx}
                                card={b.card}
                                onToggleBookmark={() => handleToggleBookmark(b.card)}
                                isBookmarked={isCardBookmarked(b.card)}
                              />
                            ) : (
                              <div
                                key={idx}
                                className="prose prose-invert max-w-none text-sm text-[#D6CEBE] leading-relaxed"
                              >
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{"content" in b ? b.content : ""}</ReactMarkdown>
                              </div>
                            )
                          )
                        ) : (
                          <div className="prose prose-invert max-w-none text-sm text-[#D6CEBE] leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-3 p-4 bg-[#1C1A14] border border-[#38352A] rounded-2xl animate-pulse text-xs text-[#DFB56C] font-mono">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Consultando pergaminhos e calculando regras...</span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* AI Codex Input Bar */}
            <div className="p-4 bg-[#171510] border-t border-[#2B2820] shrink-0">
              <div className="max-w-3xl mx-auto w-full space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={`Pergunte ao Mestre Arcano sobre regras de ${SYSTEM_SHORT_LABELS[activeSystem]?.short || activeSystem}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendMessage();
                    }}
                    disabled={isLoading}
                    className="flex-1 bg-[#14130E] border border-[#38352A] rounded-xl px-4 py-2.5 text-sm text-[#EFE8D8] placeholder-[#A79C82] outline-none focus:border-[#DFB56C]"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputText.trim()}
                    className="px-4 py-2.5 bg-[#DFB56C] hover:bg-[#b08635] disabled:opacity-50 text-[#15140F] font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Consultar</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: VTT BATTLEMAP & MULTIPLAYER DUAL CHAT */}
        {activeView === "vtt" && (
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            {/* Left: Interactive Battlemap with Initiative Bar */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Initiative Turn Bar */}
              <InitiativeTrackerBar
                combatants={initiativeState.combatants}
                currentTurnIndex={initiativeState.currentTurnIndex}
                round={initiativeState.round}
                onNextTurn={() => {
                  setInitiativeState((prev) => {
                    const nextIdx = (prev.currentTurnIndex + 1) % prev.combatants.length;
                    const nextRound = nextIdx === 0 ? prev.round + 1 : prev.round;
                    return { ...prev, currentTurnIndex: nextIdx, round: nextRound };
                  });
                }}
                onPrevTurn={() => {
                  setInitiativeState((prev) => ({
                    ...prev,
                    currentTurnIndex: (prev.currentTurnIndex - 1 + prev.combatants.length) % prev.combatants.length,
                  }));
                }}
                onResetCombat={() => {
                  setInitiativeState((prev) => ({ ...prev, round: 1, currentTurnIndex: 0 }));
                }}
                onUpdateCombatant={(id, updated) => {
                  setInitiativeState((prev) => ({
                    ...prev,
                    combatants: prev.combatants.map((c) => (c.id === id ? { ...c, ...updated } : c)),
                  }));
                }}
                onRemoveCombatant={(id) => {
                  setInitiativeState((prev) => ({
                    ...prev,
                    combatants: prev.combatants.filter((c) => c.id !== id),
                  }));
                }}
                onAddCombatant={() => {
                  const newInit = {
                    id: `init-${Date.now()}`,
                    name: "Novo Combatente",
                    initiativeRoll: Math.floor(Math.random() * 20) + 1,
                    currentHp: 20,
                    maxHp: 20,
                    ac: 12,
                    isEnemy: true,
                  };
                  setInitiativeState((prev) => ({
                    ...prev,
                    combatants: [...prev.combatants, newInit].sort((a, b) => b.initiativeRoll - a.initiativeRoll),
                  }));
                }}
                isGm={isCurrentGm}
              />

              {/* Canvas */}
              <BattlemapCanvas
                mapData={battleMapData}
                onUpdateMap={setBattleMapData}
                isGm={isCurrentGm}
                activeCharacter={activeCharacter}
                onRollCheck={handleBroadcastRoll}
              />
            </div>

            {/* Right: Multiplayer Dual Chat (IC/OOC) & Macro Roller */}
            <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-[#38352A] h-72 md:h-full shrink-0 flex flex-col">
              <CampaignDualChat
                messages={campaignMessages}
                onSendMessage={(newMsg) => {
                  const fullMsg: ChatMessage = {
                    id: `camp-msg-${Date.now()}`,
                    senderId: currentUser.id,
                    senderName: currentUser.name,
                    content: newMsg.content || "",
                    timestamp: Date.now(),
                    ...newMsg,
                  };
                  setCampaignMessages((prev) => [...prev, fullMsg]);
                }}
                currentUser={currentUser}
                characters={characters}
                activeCharacter={activeCharacter}
                onSelectActiveCharacter={setActiveCharacter}
                onOpenMacroManager={() => setIsMacroOpen(true)}
                onOpenMediaLibrary={() => setIsMediaOpen(true)}
                onViewHdImage={(url, title) => setLightboxImage({ url, title })}
              />
            </div>
          </div>
        )}
      </main>

      {/* ================= ALL 8 FEATURE MODALS ================= */}

      {/* 1. Character Sheet Modal */}
      {editingCharacter && (
        <CharacterSheetModal
          isOpen={isCharacterSheetOpen}
          sheet={editingCharacter}
          onClose={() => setIsCharacterSheetOpen(false)}
          onSave={(updated) => {
            const list = characters.map((c) => (c.id === updated.id ? updated : c));
            setCharacters(list);
            if (activeCharacter?.id === updated.id) setActiveCharacter(updated);
          }}
          onRollCheck={handleBroadcastRoll}
        />
      )}

      {/* 2. Monster Bestiary Modal */}
      <BestiaryModal
        isOpen={isBestiaryOpen}
        onClose={() => setIsBestiaryOpen(false)}
        monsters={monsters}
        onSaveMonsters={setMonsters}
        onSpawnToMap={handleSpawnMonsterToMap}
        onRollAction={(actionName, bonus, damageDice) => {
          handleBroadcastRoll(actionName, bonus);
        }}
      />

      {/* 3. Macro Manager Modal */}
      <MacroManagerModal
        isOpen={isMacroOpen}
        onClose={() => setIsMacroOpen(false)}
        macros={macros}
        onSaveMacros={setMacros}
        activeSheet={activeCharacter}
        onExecuteMacro={handleExecuteMacro}
        isGm={isCurrentGm}
      />

      {/* 4 & 5. Media Library & Lightbox Modals */}
      <MediaLibraryModal
        isOpen={isMediaOpen}
        onClose={() => setIsMediaOpen(false)}
        assets={mediaAssets}
        onSaveAssets={setMediaAssets}
        userId={currentUser.id}
        onViewHdImage={(url, title) => setLightboxImage({ url, title })}
      />

      <ImageLightboxModal
        isOpen={!!lightboxImage}
        imageUrl={lightboxImage?.url || null}
        title={lightboxImage?.title}
        onClose={() => setLightboxImage(null)}
      />

      {/* 6. NPC Folders Modal */}
      <NpcFoldersModal
        isOpen={isNpcFoldersOpen}
        onClose={() => setIsNpcFoldersOpen(false)}
        folders={npcFolders}
        npcs={npcs}
        onSaveFolders={setNpcFolders}
        onSaveNpcs={setNpcs}
        onSpawnNpcToMap={handleSpawnNpcToMap}
      />

      {/* 7. Campaign Manager & Permissions Modal */}
      <CampaignManagerModal
        isOpen={isCampaignOpen}
        onClose={() => setIsCampaignOpen(false)}
        campaigns={campaigns}
        activeCampaign={activeCampaign}
        currentUser={currentUser}
        onSelectCampaign={setActiveCampaign}
        onSaveCampaigns={setCampaigns}
      />

      {/* Original Core Modals (Dice, Knowledge, Grimoire, Profile) */}
      <DiceRoller
        isOpen={isDiceOpen}
        onClose={() => setIsDiceOpen(false)}
        onSendToChat={(rollText) => {
          if (activeView === "vtt") {
            setCampaignMessages((prev) => [
              ...prev,
              {
                id: `dice-${Date.now()}`,
                senderId: currentUser.id,
                senderName: currentUser.name,
                channel: "IC",
                content: rollText,
                timestamp: Date.now(),
                type: "ROLL",
              },
            ]);
          } else {
            setInputText(rollText);
            handleSendMessage(rollText);
          }
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
          setActiveView("codex");
          setInputText(`Explique a regra: ${title}`);
          handleSendMessage(`Explique a regra: ${title}`);
        }}
      />

      <GrimoireDrawer
        isOpen={isGrimoireOpen}
        onClose={() => setIsGrimoireOpen(false)}
        savedCards={savedCards}
        onRemoveCard={(cardId) => setSavedCards((prev) => prev.filter((c) => c.id !== cardId))}
        onClearAll={() => {
          if (window.confirm("Deseja apagar todas as fichas arquivadas no Grimório?")) setSavedCards([]);
        }}
        onAskFollowUp={(prompt) => {
          setIsGrimoireOpen(false);
          setActiveView("codex");
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

      {/* 9. RPG System Selector Modal */}
      <SystemSelectorModal
        isOpen={isMobileSystemOpen}
        activeSystem={activeSystem}
        onSelectSystem={(sys) => {
          setActiveSystem(sys);
          setIsMobileSystemOpen(false);
        }}
        onClose={() => setIsMobileSystemOpen(false)}
      />
    </div>
  );
}
