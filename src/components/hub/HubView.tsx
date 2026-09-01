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
  Plus,
  CheckCircle2,
  Heart,
  ChevronDown,
  Trash2,
} from "lucide-react";
import {
  CharacterSheet,
} from "../../types";

interface HubViewProps {
  activeCharacter: CharacterSheet | null;
  characters: CharacterSheet[];
  onNavigateView: (view: "vtt" | "hub") => void;
  onOpenCharacterSheet: (character?: CharacterSheet) => void;
  onDeleteCharacter: (character: CharacterSheet) => void;
  onOpenTrash: () => void;
  onOpenBestiary: () => void;
  onOpenMacroManager: () => void;
  onOpenMediaLibrary: () => void;
  onOpenNpcFolders: () => void;
  onOpenCampaignManager: () => void;
  onOpenDiceRoller: () => void;
}

export const HubView: React.FC<HubViewProps> = ({
  activeCharacter,
  characters,
  onNavigateView,
  onOpenCharacterSheet,
  onDeleteCharacter,
  onOpenTrash,
  onOpenBestiary,
  onOpenMacroManager,
  onOpenMediaLibrary,
  onOpenNpcFolders,
  onOpenCampaignManager,
  onOpenDiceRoller,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#15140F] text-[#EFE8D8] overflow-y-auto custom-scrollbar">
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

        {characters.length > 0 && (
          <section aria-labelledby="character-list-title" className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 id="character-list-title" className="text-xs font-mono font-bold uppercase tracking-wider text-[#DFB56C]">
                Minhas fichas ({characters.length})
              </h3>
              <button type="button" onClick={onOpenTrash} className="flex items-center gap-1 text-[10px] text-[#A79C82] hover:text-[#DFB56C]" title="Abrir lixeira de fichas"><Trash2 className="h-3 w-3" /> Lixeira</button>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {characters.map((character) => {
                const isActive = character.id === activeCharacter?.id;
                return (
                  <article
                    key={character.id}
                    className={`flex min-w-0 items-center rounded-xl border transition-colors ${
                      isActive
                        ? "border-[#DFB56C] bg-[#DFB56C]/10"
                        : "border-[#38352A] bg-[#1D1B14] hover:border-[#DFB56C]/70 hover:bg-[#232018]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenCharacterSheet(character)}
                      aria-current={isActive ? "true" : undefined}
                      className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left cursor-pointer"
                      title={`Abrir ficha de ${character.name}`}
                    >
                      <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#38352A] bg-[#15140F] flex items-center justify-center">
                        {character.avatarUrl ? (
                          <img src={character.avatarUrl} alt="" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-serif font-bold text-[#DFB56C]">{character.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#EFE8D8]">{character.name}</span>
                        <span className="block truncate text-[10px] font-mono text-[#A79C82]">
                          Nível {character.level} • {character.characterClass}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCharacter(character)}
                      className="mr-2 rounded-lg border border-transparent p-2 text-[#A79C82] transition-colors hover:border-[#7A2E27] hover:bg-[#7A2E27]/20 hover:text-[#E07A70] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DFB56C] cursor-pointer"
                      aria-label={`Excluir ficha de ${character.name}`}
                      title={`Excluir ficha de ${character.name}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </article>
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
