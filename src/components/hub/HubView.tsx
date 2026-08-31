import React from "react";
import {
  Sparkles,
  Scroll,
  Map as MapIcon,
  Flame,
  Sword,
  Shield,
  Dice5,
  Zap,
  FolderOpen,
  Image as ImageIcon,
  Crown,
  Users,
  ExternalLink,
  Plus,
  Compass,
  CheckCircle2,
  Heart,
  Menu,
  ChevronDown,
} from "lucide-react";
import {
  UserProfile,
  CharacterSheet,
  RpgSystem,
} from "../../types";

interface HubViewProps {
  currentUser: UserProfile;
  activeCharacter: CharacterSheet | null;
  characters: CharacterSheet[];
  activeSystem: RpgSystem;
  onNavigateView: (view: "vtt" | "hub") => void;
  onToggleSidebar?: () => void;
  onOpenCharacterSheet: (character?: CharacterSheet) => void;
  onOpenBestiary: () => void;
  onOpenMacroManager: () => void;
  onOpenMediaLibrary: () => void;
  onOpenNpcFolders: () => void;
  onOpenCampaignManager: () => void;
  onOpenDiceRoller: () => void;
  onOpenSystemSelector: () => void;
  onOpenProfile: () => void;
}

export const HubView: React.FC<HubViewProps> = ({
  currentUser,
  activeCharacter,
  characters,
  activeSystem,
  onNavigateView,
  onToggleSidebar,
  onOpenCharacterSheet,
  onOpenBestiary,
  onOpenMacroManager,
  onOpenMediaLibrary,
  onOpenNpcFolders,
  onOpenCampaignManager,
  onOpenDiceRoller,
  onOpenSystemSelector,
  onOpenProfile,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#15140F] text-[#EFE8D8] overflow-y-auto custom-scrollbar">
      {/* Top Banner Navigation Bar */}
      <div className="bg-[#1D1B14] border-b border-[#38352A] px-4 py-3 sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="px-3 py-1.5 bg-[#15140F] hover:bg-[#232018] text-[#DFB56C] border border-[#38352A] hover:border-[#DFB56C] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
              title="Abrir/Fechar Menu Lateral"
            >
              <Menu className="w-3.5 h-3.5" />
              <span className="font-mono">Menu</span>
            </button>
          )}

          {/* Active HUB Tab */}
          <button
            className="px-4 py-1.5 bg-[#DFB56C] text-[#15140F] font-black font-sans text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>HUB</span>
          </button>

          <button
            onClick={() => onOpenCharacterSheet(activeCharacter || undefined)}
            className="px-3.5 py-1.5 bg-[#15140F] hover:bg-[#232018] text-[#D6CEBE] hover:text-[#EFE8D8] border border-[#38352A] hover:border-[#DFB56C]/50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Fichas de Personagem"
          >
            <Users className="w-3.5 h-3.5 text-[#DFB56C]" />
            <span>Fichas</span>
          </button>

          <button
            onClick={() => onNavigateView("vtt")}
            className="px-3.5 py-1.5 bg-[#15140F] hover:bg-[#232018] text-[#D6CEBE] hover:text-[#EFE8D8] border border-[#38352A] hover:border-[#DFB56C]/50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Mesa Virtual & Battlemap"
          >
            <MapIcon className="w-3.5 h-3.5 text-[#DFB56C]" />
            <span>Mesa VTT</span>
          </button>

          <button
            onClick={onOpenBestiary}
            className="px-3.5 py-1.5 bg-[#15140F] hover:bg-[#232018] text-[#D6CEBE] hover:text-[#EFE8D8] border border-[#38352A] hover:border-[#DFB56C]/50 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Bestiário de Criaturas"
          >
            <Flame className="w-3.5 h-3.5 text-[#DFB56C]" />
            <span>Bestiário</span>
          </button>
        </div>

        {/* User quick status & System badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSystemSelector}
            className="px-2.5 py-1 bg-[#15140F] border border-[#38352A] hover:border-[#DFB56C] text-[#DFB56C] rounded-lg text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
            title="Alterar Sistema Ativo"
          >
            <Sparkles className="w-3 h-3 text-[#DFB56C]" />
            <span className="hidden sm:inline font-bold">{activeSystem}</span>
            <span className="sm:hidden font-bold">Sistema</span>
          </button>

          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#15140F] border border-[#38352A] hover:border-[#DFB56C] text-[#EFE8D8] rounded-lg text-xs font-bold transition-colors cursor-pointer"
            title="Perfil de Usuário"
          >
            <div className="w-5 h-5 rounded-full bg-[#DFB56C] text-[#15140F] flex items-center justify-center text-[10px] font-black">
              {currentUser.name.substring(0, 1).toUpperCase()}
            </div>
            <span className="hidden md:inline max-w-[100px] truncate">{currentUser.name}</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-8">
        {/* Fullscreen Hero Portal Entrance */}
        <div className="min-h-[calc(100vh-84px)] flex flex-col justify-between relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#1D1B14] via-[#1A1812] to-[#15140F] border border-[#38352A] p-6 sm:p-10 lg:p-12 shadow-2xl">
          {/* Subtle warm magical aura effects */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-[#B08635]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-[#7A2E27]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-1/4 bottom-10 w-72 h-72 bg-[#4B6B4E]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top greeting badge row */}
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#4B6B4E]/20 border border-[#4B6B4E]/40 rounded-xl text-[#8DAE8F] font-bold text-xs tracking-wider uppercase shadow-xs">
              <Sparkles className="w-4 h-4 text-[#8DAE8F]" />
              <span>PAINEL PRINCIPAL MESTRE ARCANO</span>
            </div>

          </div>

          {/* Central Hero Content */}
          <div className="relative z-10 space-y-5 my-auto py-6">
            <div className="space-y-3">
              <div className="text-xs sm:text-sm font-mono tracking-widest text-[#DFB56C] uppercase font-bold">
                Plataforma de RPG de Mesa & Gestão de Campanhas
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-serif tracking-tight text-[#EFE8D8] leading-tight drop-shadow-md">
                Bem-vindo ao Portal Mestre Arcano
              </h1>
              <p className="text-sm sm:text-lg text-[#D6CEBE] max-w-3xl leading-relaxed">
                Sua central completa para RPGs de mesa. Crie e edite fichas detalhadas de personagens, organize o Bestiário, execute rolagens automáticas com macros e conduza batalhas táticas na Mesa Virtual VTT.
              </p>
            </div>

          </div>

          {/* Bottom scroll down indicator */}
          <div className="relative z-10 pt-4 flex flex-col items-center justify-center text-center">
            <button
              onClick={() => {
                const el = document.getElementById("hub-content");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="group flex flex-col items-center gap-1 text-[#A79C82] hover:text-[#DFB56C] transition-colors cursor-pointer p-2"
              title="Rolar para baixo para ver todos os recursos"
            >
              <span className="text-xs font-mono tracking-wider uppercase group-hover:underline">
                Role para baixo para ver os módulos e atalhos
              </span>
              <ChevronDown className="w-5 h-5 animate-bounce text-[#DFB56C] mt-1" />
            </button>
          </div>
        </div>

        {/* Lower sections: Appears smoothly when scrolling down */}
        <div id="hub-content" className="space-y-6 pt-2">

        {/* Featured Quick Banner Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: VTT */}
          <div
            onClick={() => onNavigateView("vtt")}
            className="p-4 bg-[#1D1B14] border border-[#4B6B4E]/50 hover:border-[#8DAE8F] text-[#EFE8D8] rounded-2xl shadow-lg cursor-pointer hover:bg-[#232018] transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8DAE8F]">MESA VTT ATIVA</p>
              <h4 className="font-bold text-sm text-[#EFE8D8]">Entrar no Battlemap</h4>
            </div>
            <ExternalLink className="w-5 h-5 text-[#8DAE8F] group-hover:scale-110 transition-transform" />
          </div>

          {/* Card 3: Bestiário */}
          <div
            onClick={onOpenBestiary}
            className="p-4 bg-[#1D1B14] border border-[#B08635]/50 hover:border-[#DFB56C] text-[#EFE8D8] rounded-2xl shadow-lg cursor-pointer hover:bg-[#232018] transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#DFB56C]">BESTIÁRIO RPG</p>
              <h4 className="font-bold text-sm text-[#EFE8D8]">Catálogo de Monstros</h4>
            </div>
            <Flame className="w-5 h-5 text-[#DFB56C] group-hover:scale-110 transition-transform" />
          </div>

          {/* Card 4: Macros */}
          <div
            onClick={onOpenMacroManager}
            className="p-4 bg-[#1D1B14] border border-[#38352A] hover:border-[#DFB56C] text-[#EFE8D8] rounded-2xl shadow-lg cursor-pointer hover:bg-[#232018] transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#DFB56C]">MACROS ARCANAS</p>
              <h4 className="font-bold text-sm text-[#EFE8D8]">Rolagens Rápidas</h4>
            </div>
            <Zap className="w-5 h-5 text-[#DFB56C] group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Active Character Quick Bar (if character is selected) */}
        {activeCharacter && (
          <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-[#15140F] border-2 border-[#DFB56C] overflow-hidden flex items-center justify-center shrink-0">
                {activeCharacter.avatarUrl ? (
                  <img
                    src={activeCharacter.avatarUrl}
                    alt={activeCharacter.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-serif font-bold text-lg text-[#DFB56C]">
                    {activeCharacter.name.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-[#EFE8D8]">{activeCharacter.name}</h3>
                  <span className="text-[10px] font-mono bg-[#DFB56C]/15 border border-[#DFB56C]/50 text-[#DFB56C] px-2 py-0.5 rounded-full font-bold">
                    Nível {activeCharacter.level} • {activeCharacter.characterClass}
                  </span>
                </div>
                <p className="text-xs text-[#A79C82] mt-0.5">
                  {activeCharacter.race} {activeCharacter.origin ? `• ${activeCharacter.origin}` : ""} • HP: {activeCharacter.currentHp}/{activeCharacter.maxHpOverride || 30} • CA: {activeCharacter.equippedArmorBonus ? 10 + activeCharacter.equippedArmorBonus : 14}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenCharacterSheet(activeCharacter)}
                className="px-4 py-2 bg-[#DFB56C] hover:bg-[#F3CF8A] text-[#15140F] font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span>Abrir Ficha</span>
              </button>

              <button
                onClick={() => onOpenCharacterSheet(undefined)}
                className="px-3 py-2 bg-[#15140F] hover:bg-[#232018] border border-[#38352A] hover:border-[#DFB56C] text-[#EFE8D8] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                title="Criar Outro Personagem"
              >
                + Nova Ficha
              </button>
            </div>
          </div>
        )}

        {characters.length > 1 && (
          <section aria-labelledby="character-list-title" className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 id="character-list-title" className="text-xs font-mono font-bold uppercase tracking-wider text-[#DFB56C]">
                Minhas fichas ({characters.length})
              </h3>
              <span className="text-[10px] text-[#A79C82]">Selecione uma ficha para abrir</span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {characters.map((character) => {
                const isActive = character.id === activeCharacter?.id;
                return (
                  <button
                    key={character.id}
                    type="button"
                    onClick={() => onOpenCharacterSheet(character)}
                    aria-current={isActive ? "true" : undefined}
                    className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                      isActive
                        ? "border-[#DFB56C] bg-[#DFB56C]/10"
                        : "border-[#38352A] bg-[#1D1B14] hover:border-[#DFB56C]/70 hover:bg-[#232018]"
                    }`}
                  >
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#38352A] bg-[#15140F] flex items-center justify-center">
                      {character.avatarUrl ? (
                        <img src={character.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-serif font-bold text-[#DFB56C]">{character.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-[#EFE8D8]">{character.name}</span>
                      <span className="block truncate text-[10px] font-mono text-[#A79C82]">
                        Nível {character.level} • {character.characterClass}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Central Hub Grid: All Application Functions & Shortcuts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-mono font-bold text-[#DFB56C] uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Ferramentas & Funções Rápidas</span>
            </h3>
            <span className="text-xs font-mono text-[#A79C82]">Acesso Direto</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Ficha de Personagem */}
            <div
              onClick={() => onOpenCharacterSheet(activeCharacter || undefined)}
              className="p-5 bg-[#1D1B14] border border-[#38352A] hover:border-[#DFB56C] rounded-2xl shadow-xl transition-all cursor-pointer group hover:-translate-y-0.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#DFB56C]/15 border border-[#DFB56C]/40 flex items-center justify-center text-[#DFB56C]">
                  <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-mono bg-[#15140F] text-[#DFB56C] px-2 py-0.5 rounded border border-[#38352A]">
                  {characters.length} {characters.length === 1 ? "Ficha" : "Fichas"}
                </span>
              </div>
              <div>
                <h4 className="font-bold text-base text-[#EFE8D8] group-hover:text-[#DFB56C] transition-colors">
                  Ficha de Personagem
                </h4>
                <p className="text-xs text-[#A79C82] mt-1 leading-relaxed">
                  Criação e edição completa com atributos, perícias, magias, inventário e anotações.
                </p>
              </div>
            </div>

            {/* 2. Mesa Virtual (VTT) */}
            <div
              onClick={() => onNavigateView("vtt")}
              className="p-5 bg-[#1D1B14] border border-[#38352A] hover:border-[#DFB56C] rounded-2xl shadow-xl transition-all cursor-pointer group hover:-translate-y-0.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#4B6B4E]/20 border border-[#4B6B4E]/40 flex items-center justify-center text-[#8DAE8F]">
                  <MapIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-mono bg-[#15140F] text-[#8DAE8F] px-2 py-0.5 rounded border border-[#38352A]">
                  Grid & Tokens
                </span>
              </div>
              <div>
                <h4 className="font-bold text-base text-[#EFE8D8] group-hover:text-[#DFB56C] transition-colors">
                  Mesa Virtual (VTT)
                </h4>
                <p className="text-xs text-[#A79C82] mt-1 leading-relaxed">
                  Grade tática, névoa de guerra, régua de alcance e movimentação com proteção de permissões.
                </p>
              </div>
            </div>

            {/* 3. Bestiário de Monstros */}
            <div
              onClick={onOpenBestiary}
              className="p-5 bg-[#1D1B14] border border-[#38352A] hover:border-[#DFB56C] rounded-2xl shadow-xl transition-all cursor-pointer group hover:-translate-y-0.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#7A2E27]/25 border border-[#7A2E27]/50 flex items-center justify-center text-[#C4645A]">
                  <Flame className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-mono bg-[#15140F] text-[#C4645A] px-2 py-0.5 rounded border border-[#38352A]">
                  Ataques & Spawn
                </span>
              </div>
              <div>
                <h4 className="font-bold text-base text-[#EFE8D8] group-hover:text-[#DFB56C] transition-colors">
                  Bestiário & Inimigos
                </h4>
                <p className="text-xs text-[#A79C82] mt-1 leading-relaxed">
                  Consulte fichas de monstros, execute rolagens de ataque e invoque tokens diretamente no mapa.
                </p>
              </div>
            </div>

            {/* 5. Rolador de Dados Arcano */}
            <div
              onClick={onOpenDiceRoller}
              className="p-5 bg-[#1D1B14] border border-[#38352A] hover:border-[#DFB56C] rounded-2xl shadow-xl transition-all cursor-pointer group hover:-translate-y-0.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#DFB56C]/15 border border-[#DFB56C]/40 flex items-center justify-center text-[#DFB56C]">
                  <Dice5 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-mono bg-[#15140F] text-[#DFB56C] px-2 py-0.5 rounded border border-[#38352A]">
                  d4 ao d100
                </span>
              </div>
              <div>
                <h4 className="font-bold text-base text-[#EFE8D8] group-hover:text-[#DFB56C] transition-colors">
                  Rolador de Dados
                </h4>
                <p className="text-xs text-[#A79C82] mt-1 leading-relaxed">
                  Lançamento de dados com animação 3D, fórmulas customizadas, histórico e vantagens.
                </p>
              </div>
            </div>

            {/* 6. Gerenciador de Macros */}
            <div
              onClick={onOpenMacroManager}
              className="p-5 bg-[#1D1B14] border border-[#38352A] hover:border-[#DFB56C] rounded-2xl shadow-xl transition-all cursor-pointer group hover:-translate-y-0.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#B08635]/20 border border-[#B08635]/40 flex items-center justify-center text-[#DFB56C]">
                  <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-mono bg-[#15140F] text-[#DFB56C] px-2 py-0.5 rounded border border-[#38352A]">
                  Automação
                </span>
              </div>
              <div>
                <h4 className="font-bold text-base text-[#EFE8D8] group-hover:text-[#DFB56C] transition-colors">
                  Macros de Combate
                </h4>
                <p className="text-xs text-[#A79C82] mt-1 leading-relaxed">
                  Crie atalhos rápidos com fórmulas dinâmicas (@strMod, @level) enviadas direto para o chat.
                </p>
              </div>
            </div>

            {/* 7. Pastas de NPCs & Lore */}
            <div
              onClick={onOpenNpcFolders}
              className="p-5 bg-[#1D1B14] border border-[#38352A] hover:border-[#DFB56C] rounded-2xl shadow-xl transition-all cursor-pointer group hover:-translate-y-0.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#4B6B4E]/20 border border-[#4B6B4E]/40 flex items-center justify-center text-[#8DAE8F]">
                  <FolderOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-mono bg-[#15140F] text-[#8DAE8F] px-2 py-0.5 rounded border border-[#38352A]">
                  Organização
                </span>
              </div>
              <div>
                <h4 className="font-bold text-base text-[#EFE8D8] group-hover:text-[#DFB56C] transition-colors">
                  Pastas de NPCs
                </h4>
                <p className="text-xs text-[#A79C82] mt-1 leading-relaxed">
                  Estruture personagens não jogáveis em pastas personalizadas com notas e atitudes.
                </p>
              </div>
            </div>

            {/* 8. Galeria de Mídia & Lightbox */}
            <div
              onClick={onOpenMediaLibrary}
              className="p-5 bg-[#1D1B14] border border-[#38352A] hover:border-[#DFB56C] rounded-2xl shadow-xl transition-all cursor-pointer group hover:-translate-y-0.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#DFB56C]/15 border border-[#DFB56C]/40 flex items-center justify-center text-[#DFB56C]">
                  <ImageIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-mono bg-[#15140F] text-[#DFB56C] px-2 py-0.5 rounded border border-[#38352A]">
                  Imagens HD
                </span>
              </div>
              <div>
                <h4 className="font-bold text-base text-[#EFE8D8] group-hover:text-[#DFB56C] transition-colors">
                  Galeria & Mapas
                </h4>
                <p className="text-xs text-[#A79C82] mt-1 leading-relaxed">
                  Armazene artes conceituais, mapas de batalha e tokens em alta definição com lightbox.
                </p>
              </div>
            </div>

            {/* 9. Campanhas locais */}
            <div
              onClick={onOpenCampaignManager}
              className="p-5 bg-[#1D1B14] border border-[#38352A] hover:border-[#DFB56C] rounded-2xl shadow-xl transition-all cursor-pointer group hover:-translate-y-0.5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#B08635]/20 border border-[#B08635]/40 flex items-center justify-center text-[#DFB56C]">
                  <Crown className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-mono bg-[#15140F] text-[#DFB56C] px-2 py-0.5 rounded border border-[#38352A]">
                  Local
                </span>
              </div>
              <div>
                <h4 className="font-bold text-base text-[#EFE8D8] group-hover:text-[#DFB56C] transition-colors">
                  Salas & Campanhas
                </h4>
                <p className="text-xs text-[#A79C82] mt-1 leading-relaxed">
                  Gerenciamento de mesas, papéis de GM / Jogador e sincronização de mensagens IC/OOC.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
