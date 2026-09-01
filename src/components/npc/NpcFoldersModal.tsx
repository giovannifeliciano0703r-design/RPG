import React, { useMemo, useState } from "react";
import {
  X,
  Users,
  FolderPlus,
  Folder,
  UserPlus,
  Search,
  Tag,
  Shield,
  Heart,
  EyeOff,
  Trash2,
  Edit2,
  Lock,
  Sparkles,
} from "lucide-react";
import { NpcFolder, NpcEntry } from "../../types";

interface NpcFoldersModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: NpcFolder[];
  npcs: NpcEntry[];
  onSaveFolders: (folders: NpcFolder[]) => void;
  onSaveNpcs: (npcs: NpcEntry[]) => void;
  onSpawnNpcToMap?: (npc: NpcEntry) => void;
}

const DEFAULT_SAMPLE_FOLDERS: NpcFolder[] = [
  { id: "f-viloes", name: "Vilões & Inimigos", color: "#C4645A" },
  { id: "f-aliados", name: "Aliados & Patrões", color: "#8DAE8F" },
  { id: "f-cidade", name: "Cidadãos & Mercadores", color: "#DFB56C" },
  { id: "f-faccao", name: "Guilda das Sombras", color: "#9C7BA8" },
];

export const NpcFoldersModal: React.FC<NpcFoldersModalProps> = ({
  isOpen,
  onClose,
  folders,
  npcs,
  onSaveFolders,
  onSaveNpcs,
  onSpawnNpcToMap,
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNpc, setSelectedNpc] = useState<NpcEntry | null>(null);
  const [isEditingNpc, setIsEditingNpc] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const currentFolders = folders.length > 0 ? folders : DEFAULT_SAMPLE_FOLDERS;
  const filteredNpcs = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return npcs.filter((npc) => {
      const matchesSearch =
        npc.name.toLowerCase().includes(term) ||
        npc.titleOrRole.toLowerCase().includes(term) ||
        (npc.faction || "").toLowerCase().includes(term);
      const matchesFolder =
        selectedFolderId === "all" ||
        (selectedFolderId === "unorganized" && !npc.folderId) ||
        npc.folderId === selectedFolderId;
      return matchesSearch && matchesFolder;
    });
  }, [npcs, searchTerm, selectedFolderId]);

  if (!isOpen) return null;

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newF: NpcFolder = {
      id: `folder-${Date.now()}`,
      name: newFolderName.trim(),
      color: "#DFB56C",
    };
    const updated = [...currentFolders, newF];
    onSaveFolders(updated);
    setNewFolderName("");
  };

  const handleCreateNpc = () => {
    const newN: NpcEntry = {
      id: `npc-${Date.now()}`,
      folderId: selectedFolderId === "all" ? undefined : selectedFolderId,
      name: "Novo Personagem Não-Jogável",
      titleOrRole: "Mercador / Contato local",
      attitude: "Neutro",
      personality: "Pragmático, curioso sobre as intenções do grupo.",
      appearance: "Vestimentas de couro viajante com um medalhão antigo.",
      secretsGmOnly: "Sabe a localização secreta da cripta abandonada nos ermos.",
      tags: ["contato", "cidade"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const updated = [newN, ...npcs];
    onSaveNpcs(updated);
    setSelectedNpc(newN);
    setIsEditingNpc(true);
  };

  const handleSaveNpc = (updatedNpc: NpcEntry) => {
    const updated = npcs.map((n) => (n.id === updatedNpc.id ? updatedNpc : n));
    onSaveNpcs(updated);
    setSelectedNpc(updatedNpc);
    setIsEditingNpc(false);
  };

  const handleDeleteNpc = (id: string) => {
    const updated = npcs.filter((n) => n.id !== id);
    onSaveNpcs(updated);
    if (selectedNpc?.id === id) {
      setSelectedNpc(null);
      setIsEditingNpc(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Gerenciador de NPCs" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="bg-[#15140F] border border-[#7A2E27]/50 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#1C1A14] border-b border-[#38352A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7A2E27]/30 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#EFE8D8] flex items-center gap-2">
                <span>Gerenciador de NPCs & Categorias</span>
                <span className="text-xs font-mono text-[#8DAE8F] bg-[#4B6B4E]/30 px-2 py-0.5 rounded">
                  {npcs.length} NPCs
                </span>
              </h2>
              <p className="text-xs text-[#A79C82]">
                Organize aliados, vilões e mercadores em pastas com anotações secretas exclusivas do Mestre
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar gerenciador de NPCs"
            title="Fechar"
            className="p-2 text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#25231B] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Folders Sidebar */}
          <div className="w-full md:w-64 border-r border-[#38352A] bg-[#12110D] p-3 flex flex-col justify-between shrink-0">
            <div className="space-y-1 overflow-y-auto">
              <span className="text-[10px] font-mono text-[#A79C82] uppercase tracking-wider block mb-2 px-2">
                Pastas de NPCs
              </span>

              <button
                onClick={() => setSelectedFolderId("all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                  selectedFolderId === "all"
                    ? "bg-[#DFB56C]/15 text-[#DFB56C] font-bold border border-[#DFB56C]/40"
                    : "text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#1C1A14]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-[#DFB56C]" />
                  <span>Todos os NPCs</span>
                </div>
                <span className="text-[10px] font-mono">{npcs.length}</span>
              </button>

              {currentFolders.map((f) => {
                const count = npcs.filter((n) => n.folderId === f.id).length;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFolderId(f.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                      selectedFolderId === f.id
                        ? "bg-[#DFB56C]/15 text-[#DFB56C] font-bold border border-[#DFB56C]/40"
                        : "text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#1C1A14]"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className="w-4 h-4 shrink-0" style={{ color: f.color }} />
                      <span className="truncate">{f.name}</span>
                    </div>
                    <span className="text-[10px] font-mono shrink-0">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Create Folder Input */}
            <div className="pt-3 border-t border-[#38352A] space-y-2">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Nova Pasta..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 bg-[#1C1A14] border border-[#38352A] rounded-lg px-2.5 py-1 text-xs text-[#EFE8D8] outline-none"
                />
                <button
                  onClick={handleCreateFolder}
                  className="p-1.5 bg-[#DFB56C] text-[#15140F] rounded-lg hover:bg-[#b08635]"
                  title="Criar Pasta"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* NPC List Column */}
          <div className="w-full md:w-72 border-r border-[#38352A] bg-[#15140F] flex flex-col shrink-0">
            <div className="p-3 border-b border-[#38352A] flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#A79C82]" />
                <input
                  type="text"
                  placeholder="Buscar NPC..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1C1A14] border border-[#38352A] rounded-lg pl-8 pr-2 py-1 text-xs text-[#EFE8D8] outline-none focus:border-[#DFB56C]"
                />
              </div>

              <button
                onClick={handleCreateNpc}
                className="p-1.5 bg-[#DFB56C] text-[#15140F] font-bold rounded-lg hover:bg-[#b08635] flex items-center gap-1 text-xs"
                title="Novo NPC"
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredNpcs.map((npc) => (
                <button
                  type="button"
                  key={npc.id}
                  onClick={() => {
                    setSelectedNpc(npc);
                    setIsEditingNpc(false);
                  }}
                  className={`w-full p-2.5 text-left rounded-xl border transition-colors cursor-pointer ${
                    selectedNpc?.id === npc.id
                      ? "bg-[#DFB56C]/15 border-[#DFB56C] text-[#EFE8D8]"
                      : "bg-[#1C1A14] border-[#38352A] text-[#A79C82] hover:border-[#DFB56C]/40 hover:text-[#EFE8D8]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-xs text-[#EFE8D8] truncate">{npc.name}</span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                        npc.attitude === "Amigável"
                          ? "bg-[#4B6B4E]/30 text-[#8DAE8F]"
                          : npc.attitude === "Hostil"
                          ? "bg-[#7A2E27]/30 text-[#C4645A]"
                          : "bg-[#25231B] text-[#A79C82]"
                      }`}
                    >
                      {npc.attitude}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#A79C82] truncate">{npc.titleOrRole}</p>
                </button>
              ))}
            </div>
          </div>

          {/* NPC Inspector / Editor Panel */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#181611] space-y-4">
            {selectedNpc ? (
              isEditingNpc ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-mono font-bold text-[#DFB56C] uppercase">Editar Dados do NPC</h3>
                    <button
                      onClick={() => setIsEditingNpc(false)}
                      className="text-xs text-[#A79C82] hover:text-[#EFE8D8]"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-[#A79C82] block mb-1">NOME DO NPC</label>
                      <input
                        type="text"
                        value={selectedNpc.name}
                        onChange={(e) => setSelectedNpc({ ...selectedNpc, name: e.target.value })}
                        className="w-full bg-[#1C1A14] border border-[#38352A] rounded-xl px-3 py-1.5 text-xs text-[#EFE8D8] outline-none focus:border-[#DFB56C]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-[#A79C82] block mb-1">PAPEL / CARGO</label>
                      <input
                        type="text"
                        value={selectedNpc.titleOrRole}
                        onChange={(e) => setSelectedNpc({ ...selectedNpc, titleOrRole: e.target.value })}
                        className="w-full bg-[#1C1A14] border border-[#38352A] rounded-xl px-3 py-1.5 text-xs text-[#EFE8D8] outline-none focus:border-[#DFB56C]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-[#A79C82] block mb-1">PASTA DE DESTINO</label>
                      <select
                        value={selectedNpc.folderId || ""}
                        onChange={(e) => setSelectedNpc({ ...selectedNpc, folderId: e.target.value || undefined })}
                        className="w-full bg-[#1C1A14] border border-[#38352A] rounded-xl px-3 py-1.5 text-xs text-[#EFE8D8] outline-none"
                      >
                        <option value="">Sem Pasta (Geral)</option>
                        {currentFolders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-[#A79C82] block mb-1">POSTURA / ATITUDE</label>
                      <select
                        value={selectedNpc.attitude}
                        onChange={(e) => setSelectedNpc({ ...selectedNpc, attitude: e.target.value as any })}
                        className="w-full bg-[#1C1A14] border border-[#38352A] rounded-xl px-3 py-1.5 text-xs text-[#EFE8D8] outline-none"
                      >
                        <option value="Amigável">Amigável</option>
                        <option value="Neutro">Neutro</option>
                        <option value="Hostil">Hostil</option>
                        <option value="Desconhecido">Desconhecido</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#A79C82] block mb-1">PERSONALIDADE & MOTIVAÇÃO</label>
                    <textarea
                      rows={2}
                      value={selectedNpc.personality}
                      onChange={(e) => setSelectedNpc({ ...selectedNpc, personality: e.target.value })}
                      className="w-full bg-[#1C1A14] border border-[#38352A] rounded-xl p-2.5 text-xs text-[#EFE8D8] outline-none focus:border-[#DFB56C]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-[#A79C82] block mb-1">APARÊNCIA & PECULIARIDADES</label>
                    <textarea
                      rows={2}
                      value={selectedNpc.appearance}
                      onChange={(e) => setSelectedNpc({ ...selectedNpc, appearance: e.target.value })}
                      className="w-full bg-[#1C1A14] border border-[#38352A] rounded-xl p-2.5 text-xs text-[#EFE8D8] outline-none focus:border-[#DFB56C]"
                    />
                  </div>

                  <div className="p-3 bg-[#7A2E27]/20 border border-[#7A2E27] rounded-xl space-y-1">
                    <label className="text-[10px] font-mono text-[#DFB56C] flex items-center gap-1 font-bold">
                      <Lock className="w-3.5 h-3.5" /> SEGREDOS & NOTAS RESTRITAS AO MESTRE (GM)
                    </label>
                    <textarea
                      rows={3}
                      value={selectedNpc.secretsGmOnly}
                      onChange={(e) => setSelectedNpc({ ...selectedNpc, secretsGmOnly: e.target.value })}
                      className="w-full bg-[#15140F] border border-[#7A2E27]/60 rounded-lg p-2 text-xs text-[#EFE8D8] outline-none"
                    />
                  </div>

                  <button
                    onClick={() => handleSaveNpc(selectedNpc)}
                    className="w-full py-2 bg-[#DFB56C] text-[#15140F] font-bold text-xs rounded-xl hover:bg-[#b08635] transition-colors"
                  >
                    Salvar Alterações
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-[#1C1A14] border border-[#38352A] rounded-2xl flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#EFE8D8]">{selectedNpc.name}</h3>
                      <p className="text-xs text-[#A79C82]">
                        {selectedNpc.titleOrRole} • Atitude: <strong className="text-[#DFB56C]">{selectedNpc.attitude}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsEditingNpc(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] text-xs text-[#EFE8D8] rounded-xl transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#DFB56C]" /> Editar
                      </button>
                      <button
                        onClick={() => handleDeleteNpc(selectedNpc.id)}
                        className="p-1.5 text-[#C4645A] hover:bg-[#7A2E27]/20 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-[#1C1A14] border border-[#38352A] rounded-2xl space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-[#A79C82] block mb-1">PERSONALIDADE</span>
                      <p className="text-[#EFE8D8]">{selectedNpc.personality || "Sem notas registradas."}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-mono text-[#A79C82] block mb-1">APARÊNCIA</span>
                      <p className="text-[#EFE8D8]">{selectedNpc.appearance || "Sem descrição visual."}</p>
                    </div>

                    {selectedNpc.secretsGmOnly && (
                      <div className="p-3 bg-[#7A2E27]/20 border border-[#7A2E27] rounded-xl">
                        <span className="text-[10px] font-mono text-[#DFB56C] font-bold flex items-center gap-1 mb-1">
                          <Lock className="w-3.5 h-3.5" /> SEGREDO DO MESTRE:
                        </span>
                        <p className="text-xs text-[#EFE8D8] italic">{selectedNpc.secretsGmOnly}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#A79C82]">
                <Users className="w-12 h-12 text-[#38352A] mb-2" />
                <p className="text-sm font-serif text-[#EFE8D8]">Selecione um NPC para visualizar detalhes ou editar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
