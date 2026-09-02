import React, { useCallback, useEffect, useState, useMemo } from "react";
import {
  Dices,
  AlertCircle,
  ScrollText,
  Flame,
  ChevronDown,
  X,
  LogOut,
  User,
  Crown,
  Wand2,
  Sword,
  Shield,
  Moon,
  Skull,
  Users,
  Map as MapIcon,
  Zap,
  Image as ImageIcon,
  Folder,
  Layers,
  Heart,
  Settings,
  Compass,
  PanelLeftClose,
  Menu,
} from "lucide-react";
import {
  RpgSystem,
  ChatMessage,
  UserProfile,
  isUserAdmin,
  CharacterSheet,
  MonsterStatBlock,
  Macro,
  MediaAsset,
  NpcFolder,
  NpcEntry,
  Campaign,
} from "./types";
import { LoginScreen } from "./components/LoginScreen";
import { DEFAULT_MONSTERS } from "./data/defaultMonsters";
import {
  URICH_CHARACTER,
  DEFAULT_CHARACTER,
  DEFAULT_MACROS,
  DEFAULT_NPC_FOLDERS,
  DEFAULT_NPCS,
  DEFAULT_BATTLEMAP,
  DEFAULT_INITIAL_CAMPAIGN,
  DEFAULT_INITIATIVE_STATE,
} from "./data/defaultAppData";

import { executeMacro } from "./utils/macroEngine";
import { HubView } from "./components/hub/HubView";
import { normalizeRpgSystem } from "./domain/rpgSystems";
import { useAppPersistence } from "./hooks/useAppPersistence";
import { useMediaAssets } from "./hooks/useMediaAssets";
import { ConfirmDialog } from "./components/ui/Dialog";
import { STORAGE_KEYS } from "./constants/storageKeys";
import { useLiveCampaign } from "./hooks/useLiveCampaign";
import { deleteUserMediaAsset, loadUserMediaAssets, uploadCampaignMedia } from "./services/supabaseMedia";
import { useCampaignWorkspace } from "./hooks/useCampaignWorkspace";
import { useAppAuth } from "./hooks/useAppAuth";
import { getCampaignPermissions } from "./domain/campaignPermissions";
import { useSupabaseUserState } from "./hooks/useSupabaseUserState";
import type { UserAppState } from "./services/supabaseUserState";
import { supabase } from "./lib/supabase";
import { trashCharacter } from "./services/supabaseTrash";

const CharacterSheetModal = React.lazy(() => import("./components/character/CharacterSheetModal").then((module) => ({ default: module.CharacterSheetModal })));
const BestiaryModal = React.lazy(() => import("./components/bestiary/BestiaryModal").then((module) => ({ default: module.BestiaryModal })));
const MacroManagerModal = React.lazy(() => import("./components/macros/MacroManagerModal").then((module) => ({ default: module.MacroManagerModal })));
const MediaLibraryModal = React.lazy(() => import("./components/media/MediaLibraryModal").then((module) => ({ default: module.MediaLibraryModal })));
const ImageLightboxModal = React.lazy(() => import("./components/media/ImageLightboxModal").then((module) => ({ default: module.ImageLightboxModal })));
const NpcFoldersModal = React.lazy(() => import("./components/npc/NpcFoldersModal").then((module) => ({ default: module.NpcFoldersModal })));
const CampaignManagerModal = React.lazy(() => import("./components/campaign/CampaignManagerModal").then((module) => ({ default: module.CampaignManagerModal })));
const DiceRoller = React.lazy(() => import("./components/DiceRoller").then((module) => ({ default: module.DiceRoller })));
const UserProfileModal = React.lazy(() => import("./components/UserProfileModal").then((module) => ({ default: module.UserProfileModal })));
const CampaignDualChat = React.lazy(() => import("./components/campaign/CampaignDualChat").then((module) => ({ default: module.CampaignDualChat })));
const BattlemapCanvas = React.lazy(() => import("./components/vtt/BattlemapCanvas").then((module) => ({ default: module.BattlemapCanvas })));
const InitiativeTrackerBar = React.lazy(() => import("./components/vtt/InitiativeTrackerBar").then((module) => ({ default: module.InitiativeTrackerBar })));
const SystemSelectorModal = React.lazy(() => import("./components/SystemSelectorModal").then((module) => ({ default: module.SystemSelectorModal })));
const CharacterTrashModal = React.lazy(() => import("./components/character/CharacterTrashModal").then((module) => ({ default: module.CharacterTrashModal })));

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

export default function App() {
  const [activeView, setActiveView] = useState<"hub" | "vtt">("hub");
  const [activeSystem, setActiveSystem] = useState<RpgSystem>(() =>
    normalizeRpgSystem(localStorage.getItem(STORAGE_KEYS.system)),
  );

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Module 1: Character Sheets State
  const [characters, setCharacters] = useState<CharacterSheet[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.characters);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((character: CharacterSheet) => ({
            ...character,
            system: normalizeRpgSystem(character.system),
          }));
        }
      }
    } catch (e) {}
    return [URICH_CHARACTER, DEFAULT_CHARACTER];
  });
  const [activeCharacter, setActiveCharacter] = useState<CharacterSheet | null>(characters[0] || null);
  const [editingCharacter, setEditingCharacter] = useState<CharacterSheet | null>(null);
  const [isCharacterSheetOpen, setIsCharacterSheetOpen] = useState(false);

  // Module 2: Bestiary State
  const [monsters, setMonsters] = useState<MonsterStatBlock[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.monsters);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((m: MonsterStatBlock) => m.id));
          const missingDefaults = DEFAULT_MONSTERS.filter((m) => !existingIds.has(m.id));
          return [...parsed, ...missingDefaults];
        }
      }
    } catch (e) {}
    return DEFAULT_MONSTERS;
  });
  const [isBestiaryOpen, setIsBestiaryOpen] = useState(false);

  // Module 3: Macros State
  const [macros, setMacros] = useState<Macro[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.macros);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MACROS;
  });
  const [isMacroOpen, setIsMacroOpen] = useState(false);

  // Module 4 & 5: Media Library & Lightbox State
  const { mediaAssets, saveMediaAssets, mediaStorageError, clearMediaStorageError } = useMediaAssets();
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);

  // Module 6: NPC Folders State
  const [npcFolders, setNpcFolders] = useState<NpcFolder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.npcFolders);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_NPC_FOLDERS;
  });
  const [npcs, setNpcs] = useState<NpcEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.npcs);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_NPCS;
  });
  const [isNpcFoldersOpen, setIsNpcFoldersOpen] = useState(false);

  const {
    campaigns, setCampaigns,
    activeCampaign, setActiveCampaign,
    campaignMessages, setCampaignMessages,
    battleMapData, setBattleMapData,
    initiativeState, setInitiativeState,
  } = useCampaignWorkspace();
  const [isCampaignOpen, setIsCampaignOpen] = useState(false);
  const [isVttChatOpen, setIsVttChatOpen] = useState(false);

  const handleSynchronizedCampaign = useCallback((updated: Campaign) => {
    setActiveCampaign(updated);
    setCampaigns((previous) => previous.map((item) => item.id === updated.id ? updated : item));
  }, [setActiveCampaign, setCampaigns]);

  const [isDiceOpen, setIsDiceOpen] = useState(false);
  const [isMobileSystemOpen, setIsMobileSystemOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCharacterTrashOpen, setIsCharacterTrashOpen] = useState(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const handleStorageError = useCallback((key: string) => {
    setStorageNotice(`Não foi possível salvar “${key}”. Libere espaço no navegador ou exporte um backup.`);
  }, []);

  const { currentUser, setCurrentUser, isAuthChecking, isPasswordRecovery, clearPasswordRecovery, login: authenticateUser, logout: clearAuthSession } = useAppAuth({
    onPreferredSystem: setActiveSystem,
  });
  const currentUserId = currentUser?.id;

  useEffect(() => {
    if (currentUser && isPasswordRecovery) setIsProfileOpen(true);
  }, [currentUser, isPasswordRecovery]);

  const applyUserAppState = useCallback((remote: Partial<UserAppState>) => {
    if (remote.activeSystem) setActiveSystem(normalizeRpgSystem(remote.activeSystem));
    if (remote.characters) {
      const normalized = remote.characters.map((character) => ({ ...character, system: normalizeRpgSystem(character.system) }));
      setCharacters(normalized);
      setActiveCharacter(normalized[0] || null);
      setEditingCharacter(null);
      setIsCharacterSheetOpen(false);
    }
    if (remote.monsters) setMonsters(remote.monsters);
    if (remote.macros) setMacros(remote.macros);
    if (remote.npcFolders) setNpcFolders(remote.npcFolders);
    if (remote.npcs) setNpcs(remote.npcs);
    if (remote.campaigns) {
      const normalized = remote.campaigns.map((campaign) => ({ ...campaign, system: normalizeRpgSystem(campaign.system) }));
      setCampaigns(normalized);
      setActiveCampaign(normalized[0] || null);
    }
    if (remote.campaignMessages) setCampaignMessages(remote.campaignMessages);
    if (remote.battleMapData) setBattleMapData(remote.battleMapData);
    if (remote.initiativeState) setInitiativeState(remote.initiativeState);
  }, [setActiveCampaign, setCampaignMessages, setCampaigns, setBattleMapData, setInitiativeState]);

  const createFreshUserAppState = useCallback((): UserAppState => ({
    activeSystem: "Outro / não especificar",
    characters: [],
    monsters: DEFAULT_MONSTERS,
    macros: DEFAULT_MACROS,
    npcFolders: DEFAULT_NPC_FOLDERS,
    npcs: DEFAULT_NPCS,
    campaigns: [DEFAULT_INITIAL_CAMPAIGN],
    campaignMessages: [],
    battleMapData: DEFAULT_BATTLEMAP,
    initiativeState: DEFAULT_INITIATIVE_STATE,
  }), []);

  const { isLoading: isUserStateLoading, loadError: userStateLoadError, retry: retryUserStateLoad } = useSupabaseUserState({
    userId: currentUserId,
    state: {
      activeSystem,
      characters,
      monsters,
      macros,
      npcFolders,
      npcs,
      campaigns,
      campaignMessages,
      battleMapData,
      initiativeState,
    },
    applyState: applyUserAppState,
    createFreshState: createFreshUserAppState,
    onError: (message) => setStorageNotice(`Sincronização online: ${message}`),
  });

  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;
    void loadUserMediaAssets()
      .then((assets) => { if (!cancelled) saveMediaAssets(assets); })
      .catch((cause) => {
        if (!cancelled) setStorageNotice(`Biblioteca online: ${cause instanceof Error ? cause.message : "falha ao carregar imagens."}`);
      });
    return () => { cancelled = true; };
  }, [currentUserId, saveMediaAssets]);

  const liveCampaign = useLiveCampaign({
    campaign: activeCampaign,
    user: currentUser,
    battlemap: battleMapData,
    initiative: initiativeState,
    setCampaign: handleSynchronizedCampaign,
    setMessages: setCampaignMessages,
    setBattlemap: setBattleMapData,
    setInitiative: setInitiativeState,
  });

  useAppPersistence(
    {
      activeSystem,
      characters,
      monsters,
      macros,
      npcFolders,
      npcs,
      campaigns,
      campaignMessages,
      battleMapData,
      initiativeState,
    },
    handleStorageError,
  );

  const handleLogin = (user: UserProfile) => {
    authenticateUser(user);
    setActiveView("hub");
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    setIsDiceOpen(false);
    setIsCharacterSheetOpen(false);
    setIsBestiaryOpen(false);
    setIsMacroOpen(false);
    setIsMediaOpen(false);
    setIsNpcFoldersOpen(false);
    setIsCampaignOpen(false);
    clearAuthSession();
  };

  const handleUpdateProfile = async (updated: UserProfile) => {
    const safeUpdated = { ...updated, role: currentUser!.role, isAdmin: isUserAdmin(currentUser) };
    if (!supabase) throw new Error("Supabase não está configurado.");
    const { error: authError } = await supabase.auth.updateUser({
        data: {
          display_name: safeUpdated.name,
          avatar: safeUpdated.avatar,
          favorite_system: safeUpdated.favoriteSystem,
        },
      });
    if (authError) throw authError;
    const { error: profileError } = await supabase.from("profiles").update({ display_name: safeUpdated.name, avatar_url: safeUpdated.avatar }).eq("id", safeUpdated.id);
    if (profileError) throw profileError;
    setCurrentUser(safeUpdated);
    if (safeUpdated.favoriteSystem && safeUpdated.favoriteSystem !== activeSystem) {
      setActiveSystem(safeUpdated.favoriteSystem);
    }
  };

  // Broadcast roll to the campaign chat
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

  if (isAuthChecking || (currentUser && isUserStateLoading)) {
    return (
      <main className="min-h-screen bg-[#12110C] text-[#EFE8D8] flex items-center justify-center p-6 font-serif">
        {userStateLoadError && !isAuthChecking ? (
          <section role="alert" className="w-full max-w-md rounded-2xl border border-[#C4645A]/50 bg-[#1D1B14] p-6 text-center shadow-2xl">
            <AlertCircle className="mx-auto h-8 w-8 text-[#C4645A]" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-bold">Não foi possível carregar sua conta</h1>
            <p className="mt-2 text-sm text-[#BEB5A2]">Seus dados locais não serão exibidos para evitar misturar informações entre contas.</p>
            <p className="mt-3 text-xs text-[#CFC5B1]">{userStateLoadError}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={retryUserStateLoad} className="rounded-xl bg-[#DFB56C] px-5 py-3 font-bold text-[#17140E] hover:bg-[#ECC77F]">
                Tentar novamente
              </button>
              <button type="button" onClick={handleLogout} className="rounded-xl border border-[#4A4437] px-5 py-3 font-bold text-[#EFE8D8] hover:bg-white/5">
                Sair da conta
              </button>
            </div>
          </section>
        ) : (
          <p role="status" aria-live="polite" className="text-[#DFB56C]">
            {isAuthChecking ? "Validando sessão segura…" : "Carregando seus dados online…"}
          </p>
        )}
      </main>
    );
  }

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isCurrentUserAdmin = isUserAdmin(currentUser);

  const { isOwner: isCurrentGm, canManageInitiative, canEditMaps, canEditSharedMacros } = getCampaignPermissions(activeCampaign, currentUser.id);
  const systemSummary = SYSTEM_SHORT_LABELS[activeSystem];
  const currentSystemMeta = {
    icon: systemSummary.icon,
    abbrev: systemSummary.short,
    shortName: activeSystem,
    badgeBg: "bg-[#DFB56C]/10 text-[#DFB56C] border-[#DFB56C]/30",
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#14130E] text-[#EFE8D8] font-sans antialiased">
      {(storageNotice || mediaStorageError) && (
        <div role="status" className="fixed right-4 top-4 z-[100] max-w-sm rounded-xl border border-[#C4645A] bg-[#1D1B14] p-3 text-xs text-[#EFE8D8] shadow-2xl flex gap-3">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#C4645A]" />
          <span>{mediaStorageError || storageNotice}</span>
          <button
            type="button"
            onClick={() => {
              setStorageNotice(null);
              clearMediaStorageError();
            }}
            aria-label="Fechar aviso de armazenamento"
            title="Fechar aviso"
            className="ml-auto text-[#A79C82] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {/* Mobile backdrop for sidebar */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Fechar menu lateral"
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ================= DESKTOP & MOBILE SIDEBAR ================= */}
      <aside
        id="sidebar"
        className={`${
          isSidebarOpen ? "flex" : "hidden"
        } flex-col fixed md:relative inset-y-0 left-0 z-50 md:z-auto w-[280px] md:w-[260px] flex-shrink-0 border-r border-[#38352A] bg-[#1D1B14] overflow-y-auto select-none shadow-2xl md:shadow-none transition-all duration-200`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-[#38352A] flex items-center justify-between">
          <div>
            <div className="text-xl font-serif font-bold text-white mb-0.5 flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-[#B08635]" />
              <span>Mestre Arcano</span>
            </div>
            <div className="text-[10px] tracking-[0.2em] uppercase text-[#8DAE8F] font-mono">
              Fichas, Campanhas & VTT
            </div>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-xl bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] text-[#A79C82] hover:text-[#DFB56C] transition-colors cursor-pointer"
            title="Ocultar Barra Lateral"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* View Switcher: HUB vs VTT Battlemap */}
        <div className="p-3 border-b border-[#38352A] bg-[#15140F]">
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#1C1A14] border border-[#38352A] rounded-xl text-xs font-mono">
            <button
              onClick={() => setActiveView("hub")}
              className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeView === "hub"
                  ? "bg-[#DFB56C] text-[#15140F] font-bold shadow-md"
                  : "text-[#A79C82] hover:text-[#EFE8D8]"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>HUB</span>
            </button>
            <button
              onClick={() => setActiveView("vtt")}
              className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer ${
                activeView === "vtt"
                  ? "bg-[#DFB56C] text-[#15140F] font-bold shadow-md"
                  : "text-[#A79C82] hover:text-[#EFE8D8]"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>VTT</span>
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
                  <span>Campanhas online</span>
                </div>
                <span className="text-[9px] font-mono text-[#DFB56C]">{campaigns.length}</span>
              </button>
            </div>
          </div>

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
            aria-label={`Abrir perfil de ${currentUser.name}`}
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
        {/* Topbar Header (Only rendered when outside HUB to avoid duplicate header bars) */}
        {activeView !== "hub" && (
          <header
            id="topbar"
            className="h-14 border-b border-[#2B2820] bg-[#171510]/95 backdrop-blur-md shrink-0 z-10 flex items-center justify-between px-3 sm:px-6"
          >
            {/* Left: Sidebar Toggle, View mode toggler & System */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-xl bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] hover:border-[#DFB56C] text-[#DFB56C] transition-all cursor-pointer shadow-xs shrink-0 active:scale-95 flex items-center gap-1.5"
                title={isSidebarOpen ? "Ocultar Menu Lateral" : "Abrir Menu Lateral"}
              >
                {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                <span className="text-[11px] font-mono font-bold hidden sm:inline">{isSidebarOpen ? "Fechar Menu" : "Menu"}</span>
              </button>

              <button
                onClick={() => setActiveView("hub")}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] text-[#D6CEBE]"
                title="Voltar ao HUB Principal"
              >
                <Compass className="w-3.5 h-3.5 text-[#DFB56C]" />
                <span>HUB</span>
              </button>

            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsDiceOpen(true)}
                title="Abrir Rolador de Dados"
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] hover:border-[#C4645A]/60 text-[#D6CEBE] hover:text-[#EFE8D8] text-xs font-mono rounded-lg transition-colors cursor-pointer"
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
                className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1F1D16] hover:bg-[#2A271E] border border-[#38352A] hover:border-[#DFB56C]/60 text-[#DFB56C] text-xs font-mono rounded-lg transition-colors cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Ficha</span>
              </button>

            </div>
          </header>
        )}

        {/* View Mode 0: HUB & SHORTCUTS DASHBOARD */}
        {activeView === "hub" && (
          <HubView
            activeCharacter={activeCharacter}
            characters={characters}
            onNavigateView={setActiveView}
            onOpenCharacterSheet={(char) => {
              if (char) {
                setEditingCharacter(char);
                setActiveCharacter(char);
              } else {
                const newChar: CharacterSheet = {
                  ...URICH_CHARACTER,
                  id: `char-${Date.now()}`,
                  name: "Novo Personagem",
                  ownerId: currentUser.id,
                  ownerName: currentUser.name,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                setEditingCharacter(newChar);
                setCharacters((prev) => [...prev, newChar]);
                setActiveCharacter(newChar);
              }
              setIsCharacterSheetOpen(true);
            }}
            onDeleteCharacter={(character) => {
              setPendingConfirmation({
                title: "Excluir ficha de personagem?",
                description: `A ficha de ${character.name} será movida para a lixeira online por 30 dias.`,
                confirmLabel: "Mover para lixeira",
                onConfirm: async () => {
                  try { await trashCharacter(character); } catch (error) {
                    setStorageNotice(error instanceof Error ? error.message : "Não foi possível mover a ficha para a lixeira.");
                    setPendingConfirmation(null); return;
                  }
                  setCharacters((previous) => {
                    const remaining = previous.filter((item) => item.id !== character.id);
                    setActiveCharacter((current) => current?.id === character.id ? remaining[0] || null : current);
                    setEditingCharacter((current) => current?.id === character.id ? null : current);
                    return remaining;
                  });
                  if (editingCharacter?.id === character.id) setIsCharacterSheetOpen(false);
                  setPendingConfirmation(null);
                },
              });
            }}
            onOpenTrash={() => setIsCharacterTrashOpen(true)}
            onOpenBestiary={() => setIsBestiaryOpen(true)}
            onOpenMacroManager={() => setIsMacroOpen(true)}
            onOpenMediaLibrary={() => setIsMediaOpen(true)}
            onOpenNpcFolders={() => setIsNpcFoldersOpen(true)}
            onOpenCampaignManager={() => setIsCampaignOpen(true)}
            onOpenDiceRoller={() => setIsDiceOpen(true)}
          />
        )}

        {/* View Mode 1: VTT BATTLEMAP & ONLINE DUAL CHAT */}
        {activeView === "vtt" && (
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            {/* Left: Interactive Battlemap with Initiative Bar */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-end gap-2 border-b border-[#38352A] bg-[#15140F] px-3 py-1 text-[10px] font-mono" role="status">
                <span className={`h-2 w-2 rounded-full ${liveCampaign.status === "online" ? "bg-[#8DAE8F]" : liveCampaign.status === "error" ? "bg-[#C4645A]" : "bg-[#A79C82]"}`} />
                <span className="text-[#A79C82]">
                  {liveCampaign.status === "online" ? "Campanha sincronizada" : liveCampaign.status === "connecting" ? "Conectando campanha…" : liveCampaign.status === "error" ? "Sincronização indisponível — tentando novamente" : "Selecione uma campanha online"}
                </span>
              </div>
              {/* Initiative Turn Bar */}
              <React.Suspense fallback={<div role="status" className="p-3 text-center text-xs text-[#DFB56C]">Carregando iniciativa…</div>}>
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
                isGm={canManageInitiative}
              />
              </React.Suspense>

              {/* Canvas */}
              <React.Suspense fallback={<div role="status" className="flex flex-1 items-center justify-center text-sm text-[#DFB56C]">Preparando mapa tático…</div>}>
              <BattlemapCanvas
                mapData={battleMapData}
                onUpdateMap={setBattleMapData}
                isGm={canEditMaps}
                currentUser={currentUser}
                characters={characters}
                activeCharacter={activeCharacter}
                onRollCheck={handleBroadcastRoll}
                isChatOpen={isVttChatOpen}
                onToggleChat={() => setIsVttChatOpen((prev) => !prev)}
              />
              </React.Suspense>
            </div>

            {/* Right: Local Dual Chat (IC/OOC) & Macro Roller - Collapsible / Abbreviated */}
            {isVttChatOpen && (
              <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-[#38352A] h-80 md:h-full shrink-0 flex flex-col animate-in fade-in slide-in-from-right-2 duration-200">
                <React.Suspense fallback={<div role="status" className="p-4 text-center text-xs text-[#DFB56C]">Carregando chat da campanha…</div>}>
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
                    if (!activeCampaign?.remoteId) {
                      setCampaignMessages((prev) => [...prev, fullMsg]);
                      return;
                    }
                    void liveCampaign.sendMessage(newMsg).then((sent) => {
                      if (!sent) setCampaignMessages((prev) => [...prev, fullMsg]);
                    });
                  }}
                  currentUser={currentUser}
                  characters={characters}
                  activeCharacter={activeCharacter}
                  onSelectActiveCharacter={setActiveCharacter}
                  onOpenMacroManager={() => setIsMacroOpen(true)}
                  onOpenMediaLibrary={() => setIsMediaOpen(true)}
                  onViewHdImage={(url, title) => setLightboxImage({ url, title })}
                  onToggleCollapse={() => setIsVttChatOpen(false)}
                />
                </React.Suspense>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ================= ALL 8 FEATURE MODALS ================= */}
      <React.Suspense fallback={<div role="status" className="fixed bottom-4 right-4 z-[110] rounded-xl bg-[#1D1B14] px-4 py-2 text-xs text-[#DFB56C] shadow-xl">Carregando módulo…</div>}>

      {/* 1. Character Sheet Modal */}
      {isCharacterTrashOpen && (
        <React.Suspense fallback={null}>
          <CharacterTrashModal
            isOpen
            onClose={() => setIsCharacterTrashOpen(false)}
            onRestore={(character) => {
              setCharacters((previous) => previous.some((item) => item.id === character.id) ? previous : [character, ...previous]);
              setActiveCharacter(character);
            }}
          />
        </React.Suspense>
      )}

      {isCharacterSheetOpen && editingCharacter && (
        <CharacterSheetModal
          isOpen
          sheet={editingCharacter}
          characters={characters}
          onSelectCharacter={(character) => {
            setEditingCharacter(character);
            setActiveCharacter(character);
          }}
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
      {isBestiaryOpen && (
        <BestiaryModal
          isOpen
          onClose={() => setIsBestiaryOpen(false)}
          monsters={monsters}
          onSaveMonsters={setMonsters}
          onSpawnToMap={handleSpawnMonsterToMap}
          onRollAction={(actionName, bonus, damageDice) => {
            handleBroadcastRoll(actionName, bonus);
          }}
        />
      )}

      {/* 3. Macro Manager Modal */}
      {isMacroOpen && (
        <MacroManagerModal
          isOpen
          onClose={() => setIsMacroOpen(false)}
          macros={macros}
          onSaveMacros={setMacros}
          activeSheet={activeCharacter}
          onExecuteMacro={handleExecuteMacro}
          isGm={canEditSharedMacros}
        />
      )}

      {/* 4 & 5. Media Library & Lightbox Modals */}
      {isMediaOpen && (
        <MediaLibraryModal
        isOpen
        onClose={() => setIsMediaOpen(false)}
        assets={mediaAssets}
        onSaveAssets={(nextAssets) => {
          const removed = mediaAssets.filter((asset) => !nextAssets.some((next) => next.id === asset.id));
          saveMediaAssets(nextAssets);
          for (const asset of removed) {
            void deleteUserMediaAsset(asset.id).catch((cause) => {
              setStorageNotice(`Biblioteca online: ${cause instanceof Error ? cause.message : "falha ao excluir imagem."}`);
            });
          }
        }}
        userId={currentUser.id}
        onUploadFile={(file, album) => uploadCampaignMedia(file, activeCampaign?.remoteId, album)}
        onViewHdImage={(url, title) => setLightboxImage({ url, title })}
        />
      )}

      {lightboxImage && (
        <ImageLightboxModal
        isOpen
        imageUrl={lightboxImage?.url || null}
        title={lightboxImage?.title}
        onClose={() => setLightboxImage(null)}
        />
      )}

      {/* 6. NPC Folders Modal */}
      {isNpcFoldersOpen && (
        <NpcFoldersModal
        isOpen
        onClose={() => setIsNpcFoldersOpen(false)}
        folders={npcFolders}
        npcs={npcs}
        onSaveFolders={setNpcFolders}
        onSaveNpcs={setNpcs}
        onSpawnNpcToMap={handleSpawnNpcToMap}
        />
      )}

      {/* 7. Campaign Manager & Permissions Modal */}
      {isCampaignOpen && (
        <CampaignManagerModal
        isOpen
        onClose={() => setIsCampaignOpen(false)}
        campaigns={campaigns}
        activeCampaign={activeCampaign}
        currentUser={currentUser}
        onSelectCampaign={setActiveCampaign}
        onSaveCampaigns={setCampaigns}
        />
      )}

      {/* Original Core Modals (Dice and Profile) */}
      {isDiceOpen && (
        <DiceRoller
        isOpen
        onClose={() => setIsDiceOpen(false)}
        onSendToChat={(rollText) => setCampaignMessages((prev) => [
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
        ])}
        />
      )}

      {isProfileOpen && (
        <UserProfileModal
        isOpen
        onClose={() => { setIsProfileOpen(false); clearPasswordRecovery(); }}
        user={currentUser}
        onUpdateUser={handleUpdateProfile}
        onLogout={handleLogout}
        />
      )}
      </React.Suspense>

      {/* 9. RPG System Selector Modal */}
      <React.Suspense fallback={null}><SystemSelectorModal
        isOpen={isMobileSystemOpen}
        activeSystem={activeSystem}
        onSelectSystem={(sys) => {
          setActiveSystem(sys);
          setIsMobileSystemOpen(false);
        }}
        onClose={() => setIsMobileSystemOpen(false)}
      /></React.Suspense>
      <ConfirmDialog
        isOpen={pendingConfirmation !== null}
        title={pendingConfirmation?.title || "Confirmar ação"}
        description={pendingConfirmation?.description || ""}
        confirmLabel={pendingConfirmation?.confirmLabel}
        destructive
        onConfirm={() => pendingConfirmation?.onConfirm()}
        onClose={() => setPendingConfirmation(null)}
      />
    </div>
  );
}
