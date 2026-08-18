import React, { useEffect, useState } from "react";
import {
  ScrollText,
  Printer,
  ArrowLeft,
  Calendar,
  User,
  Shield,
  BookMarked,
  MessageSquare,
  Sparkles,
  Download,
  Copy,
  Check,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface RelatorioData {
  title?: string;
  date?: string;
  system?: string;
  user?: string;
  role?: string;
  messages?: Array<{
    role: string;
    content: string;
    timestamp?: number;
  }>;
  grimoireCards?: Array<{
    id: string;
    name: string;
    systemEd: string;
    category: string;
    content: string;
  }>;
  customRulesCount?: number;
  generatedAt?: number;
}

export const RelatorioView: React.FC = () => {
  const [data, setData] = useState<RelatorioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Read directly from browser's localStorage as requested
    try {
      const stored =
        localStorage.getItem("relatorio_data") ||
        localStorage.getItem("mestre_arcano_relatorio");

      if (stored) {
        const parsed = JSON.parse(stored);
        setData(parsed);
      } else {
        // Fallback demo data if opened directly without prior generation
        const backupChat = localStorage.getItem("mestre_arcano_chat_history");
        const backupGrimoire = localStorage.getItem("mestre_arcano_grimoire");
        const backupSystem = localStorage.getItem("mestre_arcano_system");
        const backupUser = localStorage.getItem("mestre_arcano_current_user");

        const userObj = backupUser ? JSON.parse(backupUser) : null;
        const messagesObj = backupChat ? JSON.parse(backupChat) : [];
        const grimoireObj = backupGrimoire ? JSON.parse(backupGrimoire) : [];

        setData({
          title: "Relatório de Sessão e Consulta Arcana",
          date: new Date().toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          system: backupSystem || "Dungeons & Dragons (D&D)",
          user: userObj?.name || "Mestre / Jogador",
          role: userObj?.role || "Mestre da Mesa",
          messages: messagesObj,
          grimoireCards: grimoireObj,
          generatedAt: Date.now(),
        });
      }
    } catch (err) {
      console.error("Erro ao carregar dados do relatório do localStorage:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    if (!data) return;
    let md = `# ${data.title || "Relatório de Sessão"}\n`;
    md += `**Data:** ${data.date || new Date().toLocaleString()}\n`;
    md += `**Sistema:** ${data.system || "Geral"}\n`;
    md += `**Conjurador/Mestre:** ${data.user || "Aventureiro"} (${data.role || "Membro da Mesa"})\n\n`;
    md += `---\n\n## 📜 Consultas e Diálogo com o Oráculo\n\n`;

    (data.messages || []).forEach((m, idx) => {
      const sender = m.role === "user" ? `👤 ${data.user || "Usuário"}` : "🔮 Mestre Arcano";
      md += `### ${sender}\n${m.content}\n\n`;
    });

    if (data.grimoireCards && data.grimoireCards.length > 0) {
      md += `\n---\n\n## 📖 Fichas do Grimório Salvas\n\n`;
      data.grimoireCards.forEach((c) => {
        md += `### ${c.name} (${c.systemEd} - ${c.category})\n${c.content}\n\n`;
      });
    }

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-sessao-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#15140F] text-[#EFE8D8] flex items-center justify-center font-mono text-sm">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-[#DFB56C] border-t-transparent rounded-full animate-spin" />
          <span>Carregando dados do relatório do localStorage...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#15140F] text-[#EFE8D8] font-sans antialiased selection:bg-[#7A2E27] selection:text-white print:bg-white print:text-black">
      {/* Top action bar - Hidden on print */}
      <header className="sticky top-0 z-20 border-b border-[#38352A] bg-[#1D1B14]/95 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => (window.location.href = "/")}
            className="flex items-center gap-1.5 text-xs font-mono text-[#A79C82] hover:text-[#EFE8D8] bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Códice</span>
          </button>
          <div className="hidden sm:flex items-center gap-2 border-l border-[#38352A] pl-3">
            <ScrollText className="w-4 h-4 text-[#DFB56C]" />
            <span className="font-serif font-bold text-sm text-[#F3EFE6]">
              Relatório de Sessão Arcano
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1.5 text-xs font-mono text-[#EFE8D8] bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#DFB56C] px-3 py-1.5 rounded-lg transition-colors"
            title="Copiar texto formatado em Markdown"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#DFB56C]" />}
            <span className="hidden sm:inline">{copied ? "Copiado!" : "Copiar MD"}</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 text-xs font-mono text-[#EFE8D8] bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#8DAE8F] px-3 py-1.5 rounded-lg transition-colors"
            title="Baixar arquivo JSON do relatório"
          >
            <Download className="w-3.5 h-3.5 text-[#8DAE8F]" />
            <span className="hidden sm:inline">Exportar JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-white bg-[#7A2E27] hover:bg-[#8F392F] px-3.5 py-1.5 rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / Salvar PDF</span>
          </button>
        </div>
      </header>

      {/* Main printable report container */}
      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 space-y-8 print:p-0 print:m-0 print:max-w-none">
        {/* Document Header Card */}
        <div className="bg-[#1D1B14] border border-[#38352A] rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden print:border-none print:shadow-none print:p-4 print:bg-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#DFB56C]/5 rounded-full blur-3xl pointer-events-none print:hidden" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#38352A] pb-6 print:border-neutral-300">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#7A2E27]/25 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C] print:border-neutral-400 print:text-black">
                <ScrollText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#F3EFE6] print:text-black">
                  {data?.title || "Relatório de Sessão & Crônica Arcana"}
                </h1>
                <p className="text-xs text-[#A79C82] font-mono mt-0.5 print:text-neutral-600">
                  Documento gerado localmente via Mestre Arcano
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-[#DFB56C] bg-[#15140F] border border-[#38352A] px-3 py-1.5 rounded-xl flex items-center gap-2 print:border-neutral-300 print:text-black print:bg-neutral-100">
              <Calendar className="w-3.5 h-3.5" />
              <span>{data?.date || new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-2">
            <div className="bg-[#15140F] border border-[#38352A] p-3 rounded-xl print:border-neutral-300 print:bg-neutral-50">
              <span className="text-[10px] font-mono uppercase text-[#A79C82] print:text-neutral-500 block">
                Sistema
              </span>
              <span className="text-xs font-bold text-[#EFE8D8] print:text-black truncate block mt-0.5">
                {data?.system || "D&D 5e"}
              </span>
            </div>

            <div className="bg-[#15140F] border border-[#38352A] p-3 rounded-xl print:border-neutral-300 print:bg-neutral-50">
              <span className="text-[10px] font-mono uppercase text-[#A79C82] print:text-neutral-500 block">
                Conjurador / Mestre
              </span>
              <span className="text-xs font-bold text-[#EFE8D8] print:text-black truncate block mt-0.5">
                {data?.user || "Aventureiro"}
              </span>
            </div>

            <div className="bg-[#15140F] border border-[#38352A] p-3 rounded-xl print:border-neutral-300 print:bg-neutral-50">
              <span className="text-[10px] font-mono uppercase text-[#A79C82] print:text-neutral-500 block">
                Papel na Mesa
              </span>
              <span className="text-xs font-bold text-[#8DAE8F] print:text-black truncate block mt-0.5">
                {data?.role || "Mestre da Mesa"}
              </span>
            </div>

            <div className="bg-[#15140F] border border-[#38352A] p-3 rounded-xl print:border-neutral-300 print:bg-neutral-50">
              <span className="text-[10px] font-mono uppercase text-[#A79C82] print:text-neutral-500 block">
                Registros
              </span>
              <span className="text-xs font-bold text-[#DFB56C] print:text-black truncate block mt-0.5">
                {data?.messages?.length || 0} consultas
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Chat / Rules Queries */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#38352A] print:border-neutral-300">
            <MessageSquare className="w-4 h-4 text-[#DFB56C] print:text-black" />
            <h2 className="font-serif font-bold text-base text-[#F3EFE6] print:text-black">
              Consultas de Regras e Diálogos da Sessão
            </h2>
          </div>

          {(!data?.messages || data.messages.length === 0) ? (
            <div className="p-6 bg-[#1D1B14] border border-[#38352A] rounded-xl text-center text-xs text-[#A79C82] print:border-neutral-300 print:text-neutral-600">
              Nenhuma consulta registrada no histórico local da sessão.
            </div>
          ) : (
            <div className="space-y-4">
              {data.messages.map((msg, index) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border transition-all ${
                      isUser
                        ? "bg-[#1D1B14] border-[#38352A] print:bg-neutral-50 print:border-neutral-300"
                        : "bg-[#15140F] border-[#38352A]/80 print:bg-white print:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-mono font-bold flex items-center gap-1.5 ${
                          isUser ? "text-[#DFB56C] print:text-black" : "text-[#8DAE8F] print:text-neutral-800"
                        }`}
                      >
                        {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>{isUser ? data.user || "Aventureiro" : "Mestre Arcano"}</span>
                      </span>
                      {msg.timestamp && (
                        <span className="text-[10px] font-mono text-[#A79C82] print:text-neutral-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-[#EFE8D8] print:text-black leading-relaxed space-y-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Section 2: Saved Grimoire Cards */}
        {data?.grimoireCards && data.grimoireCards.length > 0 && (
          <section className="space-y-4 pt-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#38352A] print:border-neutral-300">
              <BookMarked className="w-4 h-4 text-[#B08635] print:text-black" />
              <h2 className="font-serif font-bold text-base text-[#F3EFE6] print:text-black">
                Fichas de Regras Salvas no Grimório ({data.grimoireCards.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.grimoireCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-[#1D1B14] border border-[#38352A] rounded-xl p-4 space-y-2 print:border-neutral-300 print:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-sm text-[#DFB56C] print:text-black">
                      {card.name}
                    </h3>
                    <span className="text-[10px] font-mono bg-[#15140F] text-[#8DAE8F] border border-[#38352A] px-2 py-0.5 rounded print:border-neutral-300 print:text-black">
                      {card.category}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[#A79C82] print:text-neutral-500">
                    {card.systemEd}
                  </p>
                  <div className="text-xs text-[#EFE8D8] print:text-black leading-relaxed pt-1 border-t border-[#38352A]/50 print:border-neutral-200">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{card.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer Note */}
        <footer className="text-center py-6 text-[11px] font-mono text-[#A79C82] border-t border-[#38352A] print:border-neutral-300 print:text-neutral-600">
          Mestre Arcano • Relatório de Mesa gerado em {data?.date || new Date().toLocaleString()}
        </footer>
      </main>
    </div>
  );
};
