import React, { useState, useRef, useEffect } from "react";
import {
  Shield,
  Heart,
  Eye,
  EyeOff,
  Move,
  Ruler,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Flame,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Crosshair,
  Map as MapIcon,
  ChevronRight,
  ChevronLeft,
  Crown,
  X,
  MessageSquare,
  AlertCircle,
  UserCheck,
} from "lucide-react";
import {
  BattleMapData,
  MapToken,
  FogOfWarPolygon,
  MeasurementLine,
  InitiativeCombatant,
  CharacterSheet,
  UserProfile,
  isUserAdmin,
} from "../../types";
import { DEFAULT_MAP_PRESETS } from "../../data/defaultMaps";

interface BattlemapCanvasProps {
  mapData: BattleMapData;
  onUpdateMap: (updated: BattleMapData) => void;
  isGm: boolean;
  currentUser: UserProfile;
  characters: CharacterSheet[];
  activeCharacter?: CharacterSheet | null;
  onRollCheck?: (name: string, bonus: number) => void;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
}

export const BattlemapCanvas: React.FC<BattlemapCanvasProps> = ({
  mapData,
  onUpdateMap,
  isGm,
  currentUser,
  characters,
  activeCharacter,
  onRollCheck,
  isChatOpen = true,
  onToggleChat,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Tool states: 'select' | 'ruler'
  const [activeTool, setActiveTool] = useState<"select" | "ruler">("select");
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [draggedTokenId, setDraggedTokenId] = useState<string | null>(null);

  // Ruler state
  const [measureLine, setMeasureLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Quick preset selector modal
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  // Permission notification banner
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  // Auto-dismiss permission alert after 3.5 seconds
  useEffect(() => {
    if (permissionNotice) {
      const timer = setTimeout(() => setPermissionNotice(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [permissionNotice]);

  // Token editing popup
  const selectedToken = mapData.tokens.find((t) => t.id === selectedTokenId);

  // Check if current user has permission to control / move / edit a specific token
  const canControlToken = (token: MapToken): { canControl: boolean; reason?: string } => {
    // 1. GM or Admin can ALWAYS control every token (players, monsters, NPCs)
    if (isGm || isUserAdmin(currentUser)) {
      return { canControl: true };
    }

    // 2. Monsters / Enemies: ONLY GM can move or alter them
    if (token.isEnemy) {
      return {
        canControl: false,
        reason: "Monstro / Inimigo: Apenas o Mestre da Mesa (GM) pode movimentar e alterar este token.",
      };
    }

    // 3. Player Characters: ONLY creator / owner can move and alter
    const isOwner = Boolean(token.ownerId && token.ownerId === currentUser.id);
    const matchingChar = characters.find((c) => c.id === token.characterId);
    const isCharOwner = Boolean(matchingChar && matchingChar.ownerId === currentUser.id);
    const isActiveChar = Boolean(activeCharacter && activeCharacter.id === token.characterId);
    const isNameMatch = Boolean(
      activeCharacter &&
      activeCharacter.name.trim().toLowerCase() === token.name.trim().toLowerCase() &&
      (!token.ownerId || token.ownerId === currentUser.id)
    );

    if (isOwner || isCharOwner || isActiveChar || isNameMatch) {
      return { canControl: true };
    }

    return {
      canControl: false,
      reason: `Apenas o criador deste personagem ou o Mestre pode movimentar e alterar este token.`,
    };
  };

  // Snap position to grid
  const snapToGrid = (val: number, gridSize: number) => {
    return Math.round(val / gridSize) * gridSize;
  };

  // Distance calculation in meters (1 grid unit = 1.5m / 5ft)
  const calculateGridDistance = (x1: number, y1: number, x2: number, y2: number, gridSize: number) => {
    const dx = (x2 - x1) / gridSize;
    const dy = (y2 - y1) / gridSize;
    const squares = Math.hypot(dx, dy);
    const meters = (squares * 1.5).toFixed(1);
    const feet = Math.round(squares * 5);
    return { meters, feet, squares: squares.toFixed(1) };
  };

  // Move token on grid
  const handleTokenDrag = (tokenId: string, newX: number, newY: number) => {
    const snappedX = snapToGrid(newX, mapData.gridSize);
    const snappedY = snapToGrid(newY, mapData.gridSize);

    const updatedTokens = mapData.tokens.map((t) => {
      if (t.id === tokenId) {
        return { ...t, x: Math.max(0, snappedX), y: Math.max(0, snappedY) };
      }
      return t;
    });

    onUpdateMap({ ...mapData, tokens: updatedTokens });
  };

  // Pan canvas & mouse handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle click or Alt + Left click to pan
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    } else if (activeTool === "ruler") {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;
      setMeasureLine({ x1: mouseX, y1: mouseY, x2: mouseX, y2: mouseY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = (e.clientX - rect.left - pan.x) / zoom;
    const mouseY = (e.clientY - rect.top - pan.y) / zoom;

    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
    } else if (activeTool === "ruler" && measureLine) {
      setMeasureLine({ ...measureLine, x2: mouseX, y2: mouseY });
    } else if (draggedTokenId) {
      const token = mapData.tokens.find((t) => t.id === draggedTokenId);
      const tokenSizePx = mapData.gridSize * (token?.size || 1);
      handleTokenDrag(draggedTokenId, mouseX - tokenSizePx / 2, mouseY - tokenSizePx / 2);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (draggedTokenId) {
      setDraggedTokenId(null);
    }
  };

  // Handle Token Click / Drag Start with Permission Enforcement
  const handleTokenMouseDown = (e: React.MouseEvent, token: MapToken) => {
    e.stopPropagation();
    setSelectedTokenId(token.id);

    if (activeTool !== "select") return;

    if (token.isLocked) {
      setPermissionNotice(`O token "${token.name}" está travado.`);
      return;
    }

    const perm = canControlToken(token);
    if (!perm.canControl) {
      setPermissionNotice(perm.reason || "Sem permissão para movimentar este token.");
      return;
    }

    // Permission granted: initiate drag
    setDraggedTokenId(token.id);
  };

  // Add new token to center of view
  const handleAddToken = (name: string, isEnemy = false, hp = 20, ac = 12) => {
    const newToken: MapToken = {
      id: `token-${Date.now()}`,
      name,
      ownerId: currentUser.id,
      characterId: !isEnemy && activeCharacter ? activeCharacter.id : undefined,
      avatarUrl: !isEnemy && activeCharacter ? activeCharacter.avatarUrl : undefined,
      x: snapToGrid(400, mapData.gridSize),
      y: snapToGrid(300, mapData.gridSize),
      size: 1,
      currentHp: hp,
      maxHp: hp,
      ac,
      isEnemy,
      isVisibleToPlayers: true,
      conditions: [],
      speed: 9,
    };
    onUpdateMap({ ...mapData, tokens: [...mapData.tokens, newToken] });
    setSelectedTokenId(newToken.id);
  };

  // Delete token (with permission check)
  const handleDeleteToken = (token: MapToken) => {
    const perm = canControlToken(token);
    if (!perm.canControl) {
      setPermissionNotice(perm.reason || "Sem permissão para excluir este token.");
      return;
    }
    const updated = mapData.tokens.filter((t) => t.id !== token.id);
    onUpdateMap({ ...mapData, tokens: updated });
    if (selectedTokenId === token.id) setSelectedTokenId(null);
  };

  // Select Preset map
  const handleSelectPreset = (preset: (typeof DEFAULT_MAP_PRESETS)[0]) => {
    onUpdateMap({
      ...mapData,
      title: preset.title,
      imageUrl: preset.imageUrl,
      gridSize: preset.defaultGridSize,
    });
    setShowPresetMenu(false);
  };

  // Fog of war reveal all / hide all
  const handleToggleFogAll = (reveal: boolean) => {
    onUpdateMap({ ...mapData, fogRevealed: reveal });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0D0C0A] overflow-hidden select-none relative">
      {/* Permission Notice Banner */}
      {permissionNotice && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-[#15140F]/95 border border-[#C4645A] text-[#EFE8D8] px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-2">
          <Lock className="w-4 h-4 text-[#C4645A] shrink-0" />
          <span className="font-sans font-medium">{permissionNotice}</span>
          <button
            onClick={() => setPermissionNotice(null)}
            className="ml-2 text-[#A79C82] hover:text-[#EFE8D8] p-1 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* VTT Top Control Bar */}
      <div className="h-12 bg-[#15140F] border-b border-[#38352A] px-3 sm:px-4 flex items-center justify-between z-20 shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 font-serif font-bold text-sm text-[#DFB56C] truncate">
            <MapIcon className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-[140px] sm:max-w-xs">{mapData.title}</span>
          </div>

          <button
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            className="text-[11px] font-mono bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] text-[#EFE8D8] px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            Trocar Mapa
          </button>
        </div>

        {/* Toolbar buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTool("select")}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              activeTool === "select"
                ? "bg-[#DFB56C]/20 border-[#DFB56C] text-[#DFB56C]"
                : "bg-[#1C1A14] border-[#38352A] text-[#A79C82] hover:text-[#EFE8D8]"
            }`}
            title="Mover & Selecionar Tokens"
          >
            <Move className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mover</span>
          </button>

          <button
            onClick={() => {
              setActiveTool("ruler");
              setMeasureLine(null);
            }}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              activeTool === "ruler"
                ? "bg-[#DFB56C]/20 border-[#DFB56C] text-[#DFB56C]"
                : "bg-[#1C1A14] border-[#38352A] text-[#A79C82] hover:text-[#EFE8D8]"
            }`}
            title="Régua de Distância / Alcance de Magia"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Medir</span>
          </button>

          {isGm && (
            <div className="flex items-center gap-1 border-l border-[#38352A] pl-2">
              <button
                onClick={() => handleToggleFogAll(!mapData.fogRevealed)}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                  mapData.fogRevealed
                    ? "bg-[#4B6B4E]/20 border-[#4B6B4E] text-[#8DAE8F]"
                    : "bg-[#7A2E27]/30 border-[#7A2E27] text-[#C4645A]"
                }`}
                title="Névoa de Guerra (Visibilidade para Jogadores)"
              >
                {mapData.fogRevealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{mapData.fogRevealed ? "Revelado" : "Névoa"}</span>
              </button>
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-1 border-l border-[#38352A] pl-1.5 sm:pl-2">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              className="p-1.5 bg-[#1C1A14] border border-[#38352A] hover:border-[#DFB56C] text-[#A79C82] hover:text-[#EFE8D8] rounded-lg cursor-pointer"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-[#A79C82] w-8 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1.5 bg-[#1C1A14] border border-[#38352A] hover:border-[#DFB56C] text-[#A79C82] hover:text-[#EFE8D8] rounded-lg cursor-pointer"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1.5 bg-[#1C1A14] border border-[#38352A] hover:border-[#DFB56C] text-[#A79C82] hover:text-[#EFE8D8] rounded-lg cursor-pointer"
              title="Centralizar Visualização"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Chat Toggle Button in Topbar */}
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              className={`p-1.5 sm:px-2.5 sm:py-1 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border-l border-[#38352A] ml-1 ${
                isChatOpen
                  ? "bg-[#DFB56C]/15 border-[#DFB56C] text-[#DFB56C]"
                  : "bg-[#1C1A14] border-[#38352A] text-[#A79C82] hover:text-[#DFB56C] hover:border-[#DFB56C]/50"
              }`}
              title={isChatOpen ? "Abreviar / Ocultar Chat da Mesa" : "Expandir Chat da Mesa"}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isChatOpen ? "Chat Aberto" : "Chat (Oculto)"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Preset Map Selector Modal dropdown */}
      {showPresetMenu && (
        <div className="absolute top-14 left-4 z-40 bg-[#15140F] border border-[#7A2E27] rounded-2xl p-4 shadow-2xl w-80 space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold text-[#DFB56C] uppercase">Selecione um Mapa de Batalha</h4>
            <button onClick={() => setShowPresetMenu(false)} className="text-[#A79C82] hover:text-[#EFE8D8] cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {DEFAULT_MAP_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className="w-full p-2.5 bg-[#1C1A14] border border-[#38352A] hover:border-[#DFB56C] rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-serif font-bold text-[#EFE8D8]">{preset.title}</p>
                  <p className="text-[10px] text-[#A79C82]">{preset.category} • Grade {preset.defaultGridSize}px</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Interactive Stage Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 w-full h-full relative overflow-hidden cursor-crosshair"
        style={{
          backgroundColor: "#0d0c0a",
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: `${mapData.gridSize * zoom}px ${mapData.gridSize * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      >
        {/* Transform Layer for Map Background and Tokens */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: mapData.width || 1200,
            height: mapData.height || 900,
            position: "absolute",
          }}
        >
          {/* Map Base Image */}
          {mapData.imageUrl && (
            <img
              src={mapData.imageUrl}
              alt="Battlemap"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none rounded-xl"
            />
          )}

          {/* Grid Overlay Layer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(223, 181, 108, 0.15) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(223, 181, 108, 0.15) 1px, transparent 1px)
              `,
              backgroundSize: `${mapData.gridSize}px ${mapData.gridSize}px`,
            }}
          />

          {/* Fog of War Overlay */}
          {!mapData.fogRevealed && (
            <div
              className={`absolute inset-0 transition-opacity ${
                isGm ? "bg-black/60 border-2 border-dashed border-[#C4645A]" : "bg-black pointer-events-none"
              }`}
            >
              {isGm && (
                <div className="absolute top-4 left-4 bg-black/80 text-[#C4645A] font-mono text-xs px-3 py-1.5 rounded-lg border border-[#C4645A] flex items-center gap-1.5">
                  <EyeOff className="w-4 h-4" /> Névoa Ativa: Invisível para Jogadores
                </div>
              )}
            </div>
          )}

          {/* Ruler Line */}
          {measureLine && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
              <line
                x1={measureLine.x1}
                y1={measureLine.y1}
                x2={measureLine.x2}
                y2={measureLine.y2}
                stroke="#DFB56C"
                strokeWidth={3}
                strokeDasharray="6 6"
              />
              {(() => {
                const dist = calculateGridDistance(
                  measureLine.x1,
                  measureLine.y1,
                  measureLine.x2,
                  measureLine.y2,
                  mapData.gridSize
                );
                return (
                  <g transform={`translate(${(measureLine.x1 + measureLine.x2) / 2}, ${(measureLine.y1 + measureLine.y2) / 2})`}>
                    <rect x="-45" y="-14" width="90" height="24" rx="6" fill="#15140F" stroke="#DFB56C" />
                    <text x="0" y="3" fill="#DFB56C" fontSize="11" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                      {dist.meters}m ({dist.feet}ft)
                    </text>
                  </g>
                );
              })()}
            </svg>
          )}

          {/* Tokens Layer */}
          {mapData.tokens.map((token) => {
            const tokenPx = mapData.gridSize * (token.size || 1);
            const isSelected = selectedTokenId === token.id;
            const hpRatio = Math.max(0, Math.min(1, token.currentHp / (token.maxHp || 1)));
            const perm = canControlToken(token);

            return (
              <div
                key={token.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTokenId(token.id);
                }}
                onMouseDown={(e) => handleTokenMouseDown(e, token)}
                style={{
                  position: "absolute",
                  left: `${token.x}px`,
                  top: `${token.y}px`,
                  width: `${tokenPx}px`,
                  height: `${tokenPx}px`,
                  transition: draggedTokenId === token.id ? "none" : "all 0.12s ease-out",
                  zIndex: isSelected ? 25 : 10,
                }}
                className={`group flex items-center justify-center select-none ${
                  perm.canControl ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                }`}
                title={
                  perm.canControl
                    ? `${token.name} (Controlável por você)`
                    : `${token.name} (${token.isEnemy ? "Monstro / Mestre" : "Apenas criador pode mover"})`
                }
              >
                {/* Outer selection ring & HP Bar */}
                <div
                  className={`w-full h-full rounded-full flex flex-col items-center justify-center p-1 relative shadow-lg ${
                    isSelected
                      ? "ring-4 ring-[#DFB56C] ring-offset-2 ring-offset-black"
                      : perm.canControl
                      ? "ring-2 ring-[#DFB56C]/60"
                      : "ring-2 ring-[#38352A]"
                  } ${token.isEnemy ? "bg-[#7A2E27]" : "bg-[#25231B]"}`}
                >
                  {/* Token Avatar or Name initials */}
                  {token.avatarUrl ? (
                    <img
                      src={token.avatarUrl}
                      alt={token.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-full pointer-events-none"
                    />
                  ) : (
                    <span className="font-serif font-bold text-xs sm:text-sm text-[#EFE8D8]">
                      {token.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}

                  {/* Lock badge if user cannot control this token */}
                  {!perm.canControl && (
                    <div
                      className="absolute -top-1.5 -right-1.5 bg-[#15140F] border border-[#C4645A] rounded-full p-0.5 text-[#C4645A] shadow-md"
                      title="Token protegido (apenas Mestre ou Criador pode alterar)"
                    >
                      <Lock className="w-2.5 h-2.5" />
                    </div>
                  )}

                  {/* Top HP Meter */}
                  <div className="absolute -top-3 left-1 right-1 h-1.5 bg-[#15140F] border border-[#38352A] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        hpRatio > 0.5 ? "bg-[#8DAE8F]" : hpRatio > 0.25 ? "bg-[#DFB56C]" : "bg-[#C4645A]"
                      }`}
                      style={{ width: `${hpRatio * 100}%` }}
                    />
                  </div>

                  {/* Bottom Name Label */}
                  <span className="absolute -bottom-4 px-1.5 py-0.2 bg-[#15140F]/90 border border-[#38352A] text-[9px] font-bold text-[#EFE8D8] rounded whitespace-nowrap pointer-events-none truncate max-w-[80px]">
                    {token.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Token Inspector & Actions Bar */}
      {selectedToken && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-30 bg-[#15140F]/95 border border-[#7A2E27] rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2">
          {(() => {
            const perm = canControlToken(selectedToken);

            return (
              <>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-[#EFE8D8] ${
                      selectedToken.isEnemy ? "bg-[#7A2E27]" : "bg-[#25231B] border border-[#38352A]"
                    }`}
                  >
                    {selectedToken.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-[#EFE8D8] text-sm">{selectedToken.name}</span>
                      {selectedToken.isEnemy ? (
                        <span className="text-[9px] font-mono text-[#C4645A] bg-[#7A2E27]/40 px-1.5 py-0.5 rounded border border-[#7A2E27]">
                          Monstro / GM
                        </span>
                      ) : perm.canControl ? (
                        <span className="text-[9px] font-mono text-[#8DAE8F] bg-[#4B6B4E]/30 px-1.5 py-0.5 rounded border border-[#4B6B4E]">
                          Seu Token
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-[#A79C82] bg-[#25231B] px-1.5 py-0.5 rounded border border-[#38352A]">
                          Outro Jogador
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#A79C82] font-mono">
                      CA: {selectedToken.ac} • Pos: X{Math.round(selectedToken.x / mapData.gridSize)} Y{Math.round(selectedToken.y / mapData.gridSize)}
                    </p>
                  </div>
                </div>

                {/* HP Controls or Read-only badge */}
                {perm.canControl ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const updated = mapData.tokens.map((t) =>
                          t.id === selectedToken.id ? { ...t, currentHp: Math.max(0, t.currentHp - 5) } : t
                        );
                        onUpdateMap({ ...mapData, tokens: updated });
                      }}
                      className="px-2 py-1 bg-[#7A2E27] text-[#EFE8D8] font-mono font-bold rounded-lg hover:bg-[#8f352e] cursor-pointer"
                      title="Tomar 5 de Dano"
                    >
                      -5 HP
                    </button>
                    <div className="flex items-center gap-1 font-mono">
                      <Heart className="w-3.5 h-3.5 text-[#C4645A]" />
                      <span className="text-sm font-bold text-[#EFE8D8]">{selectedToken.currentHp}</span>
                      <span className="text-[#A79C82]">/ {selectedToken.maxHp}</span>
                    </div>
                    <button
                      onClick={() => {
                        const updated = mapData.tokens.map((t) =>
                          t.id === selectedToken.id ? { ...t, currentHp: Math.min(t.maxHp, t.currentHp + 5) } : t
                        );
                        onUpdateMap({ ...mapData, tokens: updated });
                      }}
                      className="px-2 py-1 bg-[#4B6B4E] text-[#EFE8D8] font-mono font-bold rounded-lg hover:bg-[#5c8560] cursor-pointer"
                      title="Curar 5 de Vida"
                    >
                      +5 HP
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1C1A14] border border-[#38352A] rounded-xl text-[11px] text-[#A79C82] font-mono">
                    <Lock className="w-3.5 h-3.5 text-[#DFB56C]" />
                    <span>
                      {selectedToken.isEnemy
                        ? "Apenas o Mestre pode alterar este monstro"
                        : "Apenas o criador pode alterar"}
                    </span>
                  </div>
                )}

                {/* Delete & Lock controls */}
                <div className="flex items-center gap-2">
                  {perm.canControl && (
                    <button
                      onClick={() => handleDeleteToken(selectedToken)}
                      className="p-1.5 text-[#C4645A] hover:bg-[#7A2E27]/20 rounded-lg transition-colors cursor-pointer"
                      title="Remover Token do Mapa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedTokenId(null)}
                    className="px-3 py-1 bg-[#25231B] text-[#A79C82] hover:text-[#EFE8D8] rounded-lg cursor-pointer"
                  >
                    Desmarcar
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Floating Add Token Quick Button (for GM or Players) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
        <button
          onClick={() =>
            handleAddToken(
              activeCharacter?.name || currentUser.name || "Meu Herói",
              false,
              activeCharacter?.currentHp || 30,
              activeCharacter?.equippedArmorBonus ? 10 + activeCharacter.equippedArmorBonus : 14
            )
          }
          className="flex items-center gap-1.5 px-3 py-2 bg-[#DFB56C] hover:bg-[#b08635] text-[#15140F] font-bold text-xs rounded-xl shadow-xl transition-all cursor-pointer"
          title="Inserir token vinculado ao seu personagem no mapa"
        >
          <Plus className="w-4 h-4" />
          <span>Inserir Meu Token</span>
        </button>

        {isGm && (
          <button
            onClick={() => handleAddToken("Monstro Inimigo", true, 22, 13)}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#7A2E27] hover:bg-[#8f352e] text-[#EFE8D8] font-bold text-xs rounded-xl shadow-xl transition-all cursor-pointer"
            title="Inserir monstro sob controle exclusivo do Mestre"
          >
            <Plus className="w-4 h-4" />
            <span>+ Monstro (GM)</span>
          </button>
        )}
      </div>

      {/* Floating Expand Chat Button (when chat is collapsed) */}
      {!isChatOpen && onToggleChat && (
        <button
          onClick={onToggleChat}
          className="absolute top-16 right-4 z-30 flex items-center gap-2 px-3.5 py-2 bg-[#15140F]/95 border border-[#DFB56C] hover:bg-[#25231B] text-[#DFB56C] font-mono text-xs font-bold rounded-xl shadow-2xl backdrop-blur-md transition-all cursor-pointer group"
          title="Clique para abrir e utilizar o Chat da Mesa (IC / OOC)"
        >
          <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Abrir Chat (IC / OOC)</span>
        </button>
      )}
    </div>
  );
};
