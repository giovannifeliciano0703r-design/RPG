import React, { useDeferredValue, useMemo, useState } from "react";
import {
  X,
  Database,
  Plus,
  Trash2,
  Edit3,
  Check,
  Search,
  BookOpen,
  Sparkles,
  Download,
  Upload,
  RotateCcw,
  Tag,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  Crown,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { KnowledgeEntry, KnowledgeCategory, RpgSystem } from "../types";
import { ConfirmDialog } from "./ui/Dialog";

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: KnowledgeEntry[];
  onSaveEntry: (entry: KnowledgeEntry) => void;
  onDeleteEntry: (id: string) => void;
  onToggleEntry: (id: string) => void;
  onResetDefaults: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonString: string) => boolean;
  onAskAboutEntry: (title: string) => void;
  isAdmin?: boolean;
}

const CATEGORIES: KnowledgeCategory[] = [
  "Regra da Casa",
  "Magia / Feitiço",
  "Item Mágico",
  "Classe / Subclasse",
  "Monstro / NPC",
  "Lore / Cenário",
  "Mecânica Geral",
];

const SYSTEMS = [
  "Universal / Todos",
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

const TEMPLATES: { label: string; entry: Partial<KnowledgeEntry> }[] = [
  {
    label: "Regra da Casa (Ex: Poção como Ação Bônus)",
    entry: {
      title: "Regra da Casa: Beber Poção como Ação Bônus",
      category: "Regra da Casa",
      system: "D&D 5ª Edição",
      keywords: ["poção", "pocao", "cura", "beber poção", "ação bônus"],
      content: `**Regra de Poções em Combate:**
- Beber uma poção de cura própria custa apenas **1 Ação Bônus** em vez de uma Ação Padrão.
- Se o personagem usar uma **Ação Completa** para beber com calma, ele recupera o **valor MÁXIMO** dos dados de cura sem precisar rolar!
- Administrar uma poção em um aliado caído ou inconsciente continua custando **1 Ação Padrão**.`,
    },
  },
  {
    label: "Item Mágico Homebrew",
    entry: {
      title: "Lâmina do Sussurro Noturno",
      category: "Item Mágico",
      system: "D&D 5ª Edição",
      keywords: ["espada", "lâmina", "sussurro", "furtividade", "arma mágica"],
      content: `**Lâmina do Sussurro Noturno (Espada Curta / Rara / Sintonização)**
- **Bônus**: +1 nas jogadas de ataque e dano.
- **Propriedades Especiais**:
  - Enquanto empunhada na escuridão ou penumbra, o portador tem vantagem em testes de Furtividade (Destreza).
  - Uma vez por descanso longo, ao acertar um ataque furtivo, pode conjurar a magia *Escuridão* centrada no alvo sem gastar componentes.`,
    },
  },
  {
    label: "Magia / Feitiço Customizado",
    entry: {
      title: "Lança de Geada Primal",
      category: "Magia / Feitiço",
      system: "D&D 5ª Edição",
      keywords: ["lança de geada", "gelo", "frio", "magia customizada", "evocação"],
      content: `**Lança de Geada Primal (2º Círculo / Evocação)**
- **Tempo de Conjuração**: 1 Ação
- **Alcance**: 60 pés
- **Componentes**: V, S
- **Duração**: Instantânea
- **Efeito**: Dispara um projétil pontiagudo de gelo puro. Ataque mágico à distância. Causa 3d8 de dano de Frio e reduz o deslocamento do alvo em 10 pés até o fim do próximo turno dele.`,
    },
  },
  {
    label: "NPC / Monstro Customizado",
    entry: {
      title: "Valerius, o Cavaleiro Renegado",
      category: "Monstro / NPC",
      system: "Universal / Todos",
      keywords: ["valerius", "cavaleiro renegado", "antagonista", "lorde"],
      content: `**Lorde Valerius (ND 5 / Antagonista)**
- **Conceito**: Um antigo paladino expurgado de sua ordem que jurou vingança usando uma armadura negra de ferro frio.
- **Fraquezas**: Vulnerável a ataques de dano Radiante e possui honra rígida (não ataca oponentes desarmados).
- **Ataques Marcantes**: Golpe Devastador (Causa 2d10+4 de corte + 1d8 necrótico).`,
    },
  },
];

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  entries,
  onSaveEntry,
  onDeleteEntry,
  onToggleEntry,
  onResetDefaults,
  onExportJSON,
  onImportJSON,
  onAskAboutEntry,
  isAdmin = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todas");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formSystem, setFormSystem] = useState("Universal / Todos");
  const [formCategory, setFormCategory] = useState<KnowledgeCategory>("Regra da Casa");
  const [formKeywords, setFormKeywords] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [importText, setImportText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredEntries = useMemo(() => {
    const term = deferredSearchTerm.toLowerCase();
    return entries.filter((entry) => {
      const matchesCat = selectedCategory === "Todas" || entry.category === selectedCategory;
      const matchesSearch =
        !term ||
        entry.title.toLowerCase().includes(term) ||
        entry.content.toLowerCase().includes(term) ||
        entry.system.toLowerCase().includes(term) ||
        entry.keywords.some((keyword) => keyword.toLowerCase().includes(term));
      return matchesCat && matchesSearch;
    });
  }, [deferredSearchTerm, entries, selectedCategory]);
  const activeEntryCount = useMemo(() => entries.filter((entry) => entry.isActive).length, [entries]);

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div role="dialog" aria-modal="true" aria-label="Acesso restrito" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#15140F] border border-[#7A2E27] rounded-2xl w-full max-w-md p-6 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-[#7A2E27]/30 border border-[#7A2E27] flex items-center justify-center text-[#C4645A] mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-[#EFE8D8]">Acesso Restrito ao Banco de Dados</h3>
            <p className="text-xs text-[#A79C82] mt-1">
              O Banco de Dados de Regras e Homebrews está oculto e protegido. Somente contas com privilégios de Administrador (ADM) têm permissão para visualizar e gerenciar estas informações.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#1D1B14] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] rounded-xl text-xs font-mono text-[#EFE8D8] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const handleStartCreate = () => {
    setEditingId(null);
    setFormTitle("");
    setFormSystem("Universal / Todos");
    setFormCategory("Regra da Casa");
    setFormKeywords("");
    setFormContent("");
    setFormIsActive(true);
    setIsEditing(true);
  };

  const handleStartEdit = (entry: KnowledgeEntry) => {
    setEditingId(entry.id);
    setFormTitle(entry.title);
    setFormSystem(entry.system);
    setFormCategory(entry.category);
    setFormKeywords(entry.keywords.join(", "));
    setFormContent(entry.content);
    setFormIsActive(entry.isActive);
    setIsEditing(true);
  };

  const handleApplyTemplate = (tpl: (typeof TEMPLATES)[0]) => {
    if (tpl.entry.title) setFormTitle(tpl.entry.title);
    if (tpl.entry.category) setFormCategory(tpl.entry.category);
    if (tpl.entry.system) setFormSystem(tpl.entry.system);
    if (tpl.entry.keywords) setFormKeywords(tpl.entry.keywords.join(", "));
    if (tpl.entry.content) setFormContent(tpl.entry.content);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      setStatusFeedback("Preencha o título e o conteúdo da regra.");
      return;
    }

    const keywordsArray = formKeywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0);

    const now = Date.now();
    const entryToSave: KnowledgeEntry = {
      id: editingId || `k-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: formTitle.trim(),
      system: formSystem,
      category: formCategory,
      keywords: keywordsArray.length > 0 ? keywordsArray : [formTitle.trim().toLowerCase()],
      content: formContent.trim(),
      isActive: formIsActive,
      createdAt: editingId ? (entries.find((e) => e.id === editingId)?.createdAt || now) : now,
      updatedAt: now,
    };

    onSaveEntry(entryToSave);
    setIsEditing(false);
    setStatusFeedback("Entrada salva com sucesso no banco de dados!");
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const handleImportSubmit = () => {
    if (!importText.trim()) return;
    const success = onImportJSON(importText.trim());
    if (success) {
      setShowImport(false);
      setImportText("");
      setStatusFeedback("Banco de dados importado com sucesso!");
      setTimeout(() => setStatusFeedback(null), 3000);
    } else {
      setStatusFeedback("Erro ao importar JSON. Verifique o formato do arquivo.");
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Base de conhecimento" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#15140F] border-t sm:border border-[#38352A] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-4xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Mobile drag handle */}
        <div className="sm:hidden w-12 h-1.5 bg-[#38352A] rounded-full mx-auto mt-3 mb-1" />

        {/* Header */}
        <div className="p-3.5 sm:p-5 border-b border-[#38352A] flex items-center justify-between bg-[#1D1B14] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#7A2E27]/20 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C]">
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-cinzel font-bold text-[#EFE8D8] flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span>Banco de Regras & Homebrews</span>
                <span className="text-[10px] sm:text-xs font-mono font-normal px-1.5 sm:px-2 py-0.5 bg-[#DFB56C]/20 border border-[#DFB56C]/50 rounded-full text-[#DFB56C] flex items-center gap-1">
                  <Crown className="w-3 h-3" /> ADM
                </span>
                <span className="text-[10px] sm:text-xs font-mono font-normal px-1.5 sm:px-2 py-0.5 bg-[#25231B] border border-[#38352A] rounded-full text-[#8DAE8F]">
                  {activeEntryCount} ativas
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-[#A79C82] line-clamp-1 sm:line-clamp-none">
                Painel Administrativo: Injeta regras customizadas diretamente na inteligência do oráculo.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar base de conhecimento"
            title="Fechar"
            className="p-2 text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#25231B] active:scale-95 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {statusFeedback && (
          <div className="bg-[#8DAE8F]/20 border-b border-[#8DAE8F]/40 px-4 py-2 text-xs text-[#8DAE8F] flex items-center justify-between">
            <span>{statusFeedback}</span>
            <button onClick={() => setStatusFeedback(null)} className="underline text-[11px]">
              Fechar
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isEditing ? (
            /* CREATE / EDIT FORM */
            <form onSubmit={handleSave} className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#38352A]">
                <h3 className="text-sm font-semibold text-[#DFB56C] flex items-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  <span>{editingId ? "Editar Entrada do Banco" : "Cadastrar Nova Regra ou Informação"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-[#A79C82] hover:text-[#EFE8D8] underline"
                >
                  Voltar à Lista
                </button>
              </div>

              {/* Quick Template Selector */}
              {!editingId && (
                <div className="bg-[#1D1B14] border border-[#38352A] rounded-xl p-3">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#DFB56C]" />
                    <span>Ou comece a partir de um modelo pronto:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TEMPLATES.map((tpl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyTemplate(tpl)}
                        className="text-xs bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] text-[#EFE8D8] px-3 py-1.5 rounded-lg transition-all"
                      >
                        + {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#EFE8D8] mb-1.5">
                    Título da Informação / Regra *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Regra da Casa: Poção como Ação Bônus"
                    className="w-full bg-[#15140F] border border-[#38352A] rounded-lg py-2.5 px-3.5 text-sm text-[#EFE8D8] placeholder-[#666] focus:outline-none focus:border-[#4B6B4E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#EFE8D8] mb-1.5">
                    Sistema de RPG
                  </label>
                  <select
                    value={formSystem}
                    onChange={(e) => setFormSystem(e.target.value)}
                    className="w-full bg-[#15140F] border border-[#38352A] rounded-lg py-2.5 px-3 text-sm text-[#EFE8D8] focus:outline-none focus:border-[#4B6B4E]"
                  >
                    {SYSTEMS.map((sys) => (
                      <option key={sys} value={sys}>
                        {sys}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#EFE8D8] mb-1.5">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as KnowledgeCategory)}
                    className="w-full bg-[#15140F] border border-[#38352A] rounded-lg py-2.5 px-3 text-sm text-[#EFE8D8] focus:outline-none focus:border-[#4B6B4E]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#EFE8D8] mb-1.5 flex items-center justify-between">
                    <span>Palavras-chave (separadas por vírgula)</span>
                    <span className="text-[10px] text-[#A79C82]">Para busca inteligente</span>
                  </label>
                  <input
                    type="text"
                    value={formKeywords}
                    onChange={(e) => setFormKeywords(e.target.value)}
                    placeholder="Ex: poção, cura, combate, item mágico"
                    className="w-full bg-[#15140F] border border-[#38352A] rounded-lg py-2.5 px-3.5 text-sm text-[#EFE8D8] placeholder-[#666] focus:outline-none focus:border-[#4B6B4E]"
                  />
                </div>
              </div>

              {/* Rule Content */}
              <div>
                <label className="block text-xs font-semibold text-[#EFE8D8] mb-1.5 flex items-center justify-between">
                  <span>Conteúdo Completo da Regra / Informação *</span>
                  <span className="text-[10px] text-[#A79C82]">Suporta Markdown e listas</span>
                </label>
                <textarea
                  required
                  rows={8}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Escreva os detalhes da regra, atributos, modificadores, custos, vantagens e exceções..."
                  className="w-full bg-[#15140F] border border-[#38352A] rounded-lg p-3.5 text-sm text-[#EFE8D8] placeholder-[#666] focus:outline-none focus:border-[#4B6B4E] font-mono leading-relaxed"
                />
              </div>

              {/* Active Switch & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-[#38352A]">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#EFE8D8]">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-[#38352A] bg-[#15140F] text-[#7A2E27] focus:ring-0"
                  />
                  <span>Ativar esta regra no Mestre Arcano para responder perguntas</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 bg-[#25231B] hover:bg-[#38352A] text-[#EFE8D8] rounded-lg text-xs font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#7A2E27] hover:bg-[#8F392F] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Salvar no Banco</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* LIST VIEW */
            <div className="space-y-4">
              {/* Controls Toolbar */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search & Category Filter */}
                <div className="flex flex-1 gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A79C82]" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Pesquisar por título, palavra-chave ou conteúdo..."
                      className="w-full bg-[#1D1B14] border border-[#38352A] rounded-lg pl-9 pr-3 py-2 text-xs text-[#EFE8D8] placeholder-[#A79C82] focus:outline-none focus:border-[#4B6B4E]"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-[#1D1B14] border border-[#38352A] rounded-lg px-3 py-2 text-xs text-[#EFE8D8] focus:outline-none focus:border-[#4B6B4E]"
                  >
                    <option value="Todas">Todas Categorias</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Add New Button */}
                <button
                  onClick={handleStartCreate}
                  className="bg-[#7A2E27] hover:bg-[#8F392F] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors shrink-0 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Nova Informação</span>
                </button>
              </div>

              {/* JSON Import/Export Drawer */}
              {showImport ? (
                <div className="bg-[#1D1B14] border border-[#38352A] rounded-xl p-4 space-y-3">
                  <div className="text-xs font-semibold text-[#DFB56C] flex items-center justify-between">
                    <span>Importar Banco de Dados em Formato JSON</span>
                    <button
                      onClick={() => setShowImport(false)}
                      className="text-xs text-[#A79C82] hover:text-[#EFE8D8]"
                    >
                      Fechar
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder='Cole aqui o JSON exportado do banco (ex: [{"title": "Regra...", "content": "..."}])...'
                    className="w-full bg-[#15140F] border border-[#38352A] rounded-lg p-2.5 text-xs text-[#EFE8D8] font-mono"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowImport(false)}
                      className="px-3 py-1.5 bg-[#25231B] text-xs text-[#EFE8D8] rounded"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleImportSubmit}
                      className="px-4 py-1.5 bg-[#4B6B4E] hover:bg-[#5C855F] text-white text-xs font-semibold rounded"
                    >
                      Carregar Dados
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Entries Grid / List */}
              {filteredEntries.length === 0 ? (
                <div className="bg-[#1D1B14] border border-[#38352A] border-dashed rounded-xl p-8 text-center space-y-3">
                  <BookOpen className="w-8 h-8 text-[#A79C82] mx-auto" />
                  <div className="text-sm font-semibold text-[#EFE8D8]">
                    Nenhuma entrada encontrada no banco de dados
                  </div>
                  <p className="text-xs text-[#A79C82] max-w-md mx-auto">
                    {searchTerm
                      ? "Nenhuma regra bateu com o termo pesquisado. Tente outro filtro ou crie uma nova entrada."
                      : "Cadastre suas regras da casa, itens mágicos, magias homebrew ou fichas de NPCs para que o Mestre Arcano as utilize como fonte primária."}
                  </p>
                  <button
                    onClick={handleStartCreate}
                    className="px-4 py-2 bg-[#7A2E27] hover:bg-[#8F392F] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Primeira Informação</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`content-auto-list-item bg-[#1D1B14] border transition-all rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        entry.isActive ? "border-[#38352A] hover:border-[#DFB56C]/60" : "border-[#25231B] opacity-60"
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-[#EFE8D8] truncate">
                            {entry.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#25231B] text-[#DFB56C] border border-[#38352A]">
                            {entry.category}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#15140F] text-[#A79C82] border border-[#25231B]">
                            {entry.system}
                          </span>
                          {!entry.isActive && (
                            <span className="text-[10px] text-[#C4645A] font-mono font-semibold">
                              (Desativada no Oráculo)
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#A79C82] line-clamp-2 leading-relaxed">
                          {entry.content}
                        </p>

                        {entry.keywords && entry.keywords.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-[#8DAE8F]">
                            <Tag className="w-3 h-3" />
                            <span>{entry.keywords.join(", ")}</span>
                          </div>
                        )}
                      </div>

                      {/* Entry Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#25231B]">
                        <button
                          onClick={() => onAskAboutEntry(entry.title)}
                          title="Perguntar sobre esta regra ao Mestre Arcano"
                          className="px-2.5 py-1.5 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] text-[#DFB56C] rounded-lg text-xs flex items-center gap-1 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#DFB56C]" />
                          <span>Consultar</span>
                        </button>

                        <button
                          onClick={() => onToggleEntry(entry.id)}
                          title={entry.isActive ? "Desativar regra no oráculo" : "Ativar regra no oráculo"}
                          aria-label={entry.isActive ? `Desativar ${entry.title}` : `Ativar ${entry.title}`}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            entry.isActive
                              ? "bg-[#4B6B4E]/20 text-[#8DAE8F] border-[#4B6B4E]"
                              : "bg-[#25231B] text-[#A79C82] border-[#38352A]"
                          }`}
                        >
                          {entry.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>

                        <button
                          onClick={() => handleStartEdit(entry)}
                          title="Editar regra"
                          aria-label={`Editar ${entry.title}`}
                          className="p-1.5 bg-[#25231B] hover:bg-[#38352A] text-[#EFE8D8] rounded-lg transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setPendingAction({
                            title: "Excluir regra?",
                            description: `“${entry.title}” será removida permanentemente da base local.`,
                            confirmLabel: "Excluir regra",
                            onConfirm: () => onDeleteEntry(entry.id),
                          })}
                          title="Excluir regra"
                          aria-label={`Excluir ${entry.title}`}
                          className="p-1.5 bg-[#7A2E27]/20 hover:bg-[#7A2E27] text-[#C4645A] hover:text-white rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Utility Bar */}
        <div className="p-3 sm:p-4 border-t border-[#38352A] bg-[#1D1B14] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#A79C82]">
            <HelpCircle className="w-4 h-4 text-[#DFB56C]" />
            <span>As regras salvas ficam salvas localmente e integradas a cada prompt de IA.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportJSON}
              className="px-2.5 py-1.5 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] text-[#EFE8D8] rounded text-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#DFB56C]" />
              <span>Exportar JSON</span>
            </button>

            <button
              onClick={() => setShowImport(!showImport)}
              className="px-2.5 py-1.5 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] text-[#EFE8D8] rounded text-xs flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-[#8DAE8F]" />
              <span>Importar JSON</span>
            </button>

            <button
              onClick={() => setPendingAction({
                title: "Restaurar regras de exemplo?",
                description: "As regras personalizadas atuais serão substituídas pelo conjunto de demonstração.",
                confirmLabel: "Restaurar padrões",
                onConfirm: onResetDefaults,
              })}
              className="px-2.5 py-1.5 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] text-[#A79C82] hover:text-[#EFE8D8] rounded text-xs flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrões</span>
            </button>
          </div>
        </div>
        <ConfirmDialog
          isOpen={pendingAction !== null}
          title={pendingAction?.title || "Confirmar ação"}
          description={pendingAction?.description || ""}
          confirmLabel={pendingAction?.confirmLabel}
          destructive
          onConfirm={() => pendingAction?.onConfirm()}
          onClose={() => setPendingAction(null)}
        />
      </div>
    </div>
  );
};
