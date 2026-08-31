import { describe, expect, it } from "vitest";
import { buildKnowledgeContext, selectRelevantKnowledge } from "./rag";

const entries = [
  {
    id: "fire",
    title: "Fogo Alquímico",
    system: "Dungeons & Dragons (D&D)",
    category: "Regra da Casa",
    keywords: ["fogo", "alquimia"],
    content: "Na nossa mesa, fogo alquímico ilumina a área.",
    isActive: true,
  },
  {
    id: "stealth",
    title: "Furtividade",
    system: "Pathfinder",
    category: "Mecânica Geral",
    keywords: ["esconder"],
    content: "Uma anotação não relacionada.",
    isActive: true,
  },
];

describe("RAG selection", () => {
  it("selects only relevant active entries", () => {
    const selected = selectRelevantKnowledge("Como funciona o fogo alquímico?", entries, "Dungeons & Dragons (D&D)");
    expect(selected.map((entry) => entry.id)).toEqual(["fire"]);
  });

  it("limits untrusted content and labels it as data, not instructions", () => {
    const selected = selectRelevantKnowledge("fogo", [{ ...entries[0], content: "x".repeat(10_000) }]);
    expect(selected[0].content.length).toBe(4_000);
    const context = buildKnowledgeContext(selected);
    expect(context).toContain("conteúdo de referência não confiável");
    expect(context).toContain("<base_usuario>");
  });

  it("does not select entries for generic stop-word-only questions", () => {
    expect(selectRelevantKnowledge("Como funciona a regra?", entries)).toEqual([]);
  });

  it("uses the active system to break relevant matches deterministically", () => {
    const duplicated = [entries[0], { ...entries[0], id: "fire-pf", system: "Pathfinder" }];
    expect(selectRelevantKnowledge("fogo alquímico", duplicated, "Pathfinder")[0].id).toBe("fire-pf");
  });
});
