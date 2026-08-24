/**
 * Small offline index. It intentionally contains only concise, original summaries
 * of open rules. Proprietary rulebook text and stat blocks must be supplied by the
 * user from material they are entitled to use.
 */

export interface FallbackRule {
  keywords: string[];
  system: string;
  source: string;
  license: "CC-BY-4.0" | "ORC" | "CC-BY-3.0" | "reference-only";
  summary: string;
}

export const KNOWLEDGE_BASE: FallbackRule[] = [
  {
    keywords: ["vantagem", "desvantagem", "advantage", "disadvantage"],
    system: "Dungeons & Dragons (D&D)",
    source: "System Reference Document 5.1",
    license: "CC-BY-4.0",
    summary:
      "Vantagem faz a jogada usar o maior de dois d20; desvantagem usa o menor. Se ambas se aplicarem, a jogada volta a usar um único d20, independentemente da quantidade de fontes.",
  },
  {
    keywords: ["bárbaro", "barbaro", "barbarian", "fúria", "furia"],
    system: "Dungeons & Dragons (D&D)",
    source: "System Reference Document 5.1",
    license: "CC-BY-4.0",
    summary:
      "O bárbaro é uma classe marcial resistente cuja característica central é a Fúria. Ela melhora seu desempenho físico em combate e exige atenção às condições de ativação e manutenção descritas no SRD.",
  },
  {
    keywords: ["mago", "wizard", "grimório", "grimorio"],
    system: "Dungeons & Dragons (D&D)",
    source: "System Reference Document 5.1",
    license: "CC-BY-4.0",
    summary:
      "O mago prepara magias a partir de um grimório e usa Inteligência como atributo de conjuração. A lista preparada e os espaços disponíveis são conceitos diferentes.",
  },
  {
    keywords: ["bola de fogo", "fireball", "magia de fogo"],
    system: "Dungeons & Dragons (D&D)",
    source: "System Reference Document 5.1",
    license: "CC-BY-4.0",
    summary:
      "Bola de Fogo é uma magia de evocação em área que exige salvaguarda de Destreza e causa dano de fogo. Consulte o SRD para alcance, área, dados e progressão exatos.",
  },
  {
    keywords: ["3 ações", "tres acoes", "economia de acoes", "pathfinder 2e", "pf2e"],
    system: "Pathfinder",
    source: "Pathfinder Player Core rules",
    license: "ORC",
    summary:
      "No modo de encontro, cada participante normalmente recebe três ações e uma reação por turno. Atividades indicam quantas ações consomem, permitindo combinar movimento, ataques e outras opções.",
  },
  {
    keywords: ["fate", "aspectos", "pontos de destino", "fate points"],
    system: "Fate Core",
    source: "Fate Core System Reference Document",
    license: "CC-BY-3.0",
    summary:
      "Aspectos descrevem fatos narrativos relevantes. Pontos de Destino permitem invocá-los para obter benefícios, enquanto complicações aceitas podem devolver recursos ao jogador.",
  },
  {
    keywords: [
      "tormenta20",
      "vampiro",
      "call of cthulhu",
      "gurps",
      "savage worlds",
      "cyberpunk red",
      "old dragon",
    ],
    system: "Sistema proprietário",
    source: "Material licenciado do usuário",
    license: "reference-only",
    summary:
      "A base offline não redistribui regras detalhadas deste sistema. Cadastre um resumo autorizado na Base de Regras ou consulte o livro que você possui para obter números e exceções.",
  },
];

export interface CustomKnowledgeEntry {
  id: string;
  title: string;
  system: string;
  category: string;
  keywords: string[];
  content: string;
  isActive: boolean;
}

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function escapeMarkdown(value: string): string {
  return value.replace(/[\\`*_{}[\]<>#]/g, "\\$&");
}

function customEntryMatches(query: string, entry: CustomKnowledgeEntry): boolean {
  const normalizedQuery = normalize(query);
  const title = normalize(entry.title);
  return (
    normalizedQuery.includes(title) ||
    title.includes(normalizedQuery) ||
    entry.keywords.some((keyword) => keyword.trim() && normalizedQuery.includes(normalize(keyword.trim())))
  );
}

function formatCustomEntry(entry: CustomKnowledgeEntry): string {
  return `**${escapeMarkdown(entry.title)} — ${escapeMarkdown(entry.system || "Regra da Casa")}**
- **Categoria**: ${escapeMarkdown(entry.category || "Regra personalizada")}
- **Conteúdo fornecido pelo usuário**:
${entry.content}
- **Fonte**: Base personalizada do usuário
- **Nível de confiança**: Alta apenas como definição desta mesa; não implica regra oficial`;
}

function formatOpenRule(rule: FallbackRule): string {
  const confidence = rule.license === "reference-only" ? "Baixa" : "Média";
  return `**Consulta offline — ${rule.system}**
- **Descrição resumida**: ${rule.summary}
- **Fonte**: ${rule.source}
- **Licença/proveniência**: ${rule.license}
- **Nível de confiança**: ${confidence}

> A base offline é deliberadamente resumida. Confirme detalhes no material de referência antes da sessão.`;
}

export function findFallbackAnswer(
  query: string,
  activeSystem?: string,
  customKnowledge?: CustomKnowledgeEntry[],
): string {
  if (Array.isArray(customKnowledge)) {
    const customMatch = customKnowledge.find((entry) => entry.isActive && customEntryMatches(query, entry));
    if (customMatch) return formatCustomEntry(customMatch);
  }

  const normalizedQuery = normalize(query);
  const rule = KNOWLEDGE_BASE.find((entry) => entry.keywords.some((keyword) => normalizedQuery.includes(normalize(keyword))));
  if (rule) return formatOpenRule(rule);

  return `**Consulta offline: ${escapeMarkdown(query.slice(0, 60))} — ${escapeMarkdown(activeSystem || "Sistema não identificado")}**
- **Status**: Nenhum trecho relevante com proveniência conhecida foi encontrado.
- **Fonte**: Nenhuma
- **Nível de confiança**: Baixa

> Cadastre uma anotação autorizada na Base de Regras ou consulte o material licenciado do sistema.`;
}
