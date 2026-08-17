import { ParsedBlock, ParsedRpgCard, ConfidenceLevel, CardField } from "../types";

/**
 * Normalizes confidence level string to Alta, Média, or Baixa
 */
export function normalizeConfidence(raw: string): ConfidenceLevel {
  const clean = (raw || "").trim().toLowerCase();
  if (clean.startsWith("alta") || clean.includes("alta")) return "Alta";
  if (clean.startsWith("baixa") || clean.includes("baixa")) return "Baixa";
  return "Média";
}

/**
 * Parses a block of lines into a structured RPG card if matching pattern
 */
export function parseSingleCardBlock(rawBlock: string, index: number): ParsedRpgCard | null {
  const lines = rawBlock.split("\n").map((l) => l.trimEnd()).filter((l) => l.length > 0);
  if (lines.length === 0) return null;

  // Check if first line matches **[Nome] — [Sistema]** or **[Nome]**
  const firstLine = lines[0].trim();
  const titleMatch = firstLine.match(/^\*\*(.+?)\*\*$/);
  if (!titleMatch) return null;

  const fullTitle = titleMatch[1];
  let name = fullTitle;
  let systemEd = "";

  if (fullTitle.includes(" — ")) {
    const parts = fullTitle.split(" — ");
    name = parts[0].trim();
    systemEd = parts.slice(1).join(" — ").trim();
  } else if (fullTitle.includes(" - ")) {
    const parts = fullTitle.split(" - ");
    name = parts[0].trim();
    systemEd = parts.slice(1).join(" - ").trim();
  }

  // Must contain at least one characteristic label like - **Categoria**: or - **Descrição resumida**:
  const hasRpgLabels = lines.some((l) =>
    /^[-*]\s*\*\*(Categoria|Descrição|Atributos|Habilidades|Vantagens|Desvantagens|Fonte|Nível de confiança|Buffs)/i.test(l)
  );

  if (!hasRpgLabels) return null;

  let category = "Mecânica";
  let description = "";
  let attributes = "";
  let buffsDebuffs = "";
  let source = "";
  let confidence: ConfidenceLevel = "Média";

  const abilities: string[] = [];
  const advantages: string[] = [];
  const disadvantages: string[] = [];
  const extraFields: CardField[] = [];

  let currentTarget: "abilities" | "advantages" | "disadvantages" | "extra" | null = null;
  let currentExtraField: CardField | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const fieldMatch = line.match(/^[-*]\s*\*\*(.+?)\*\*:\s*(.*)$/);

    if (fieldMatch) {
      const label = fieldMatch[1].trim();
      const val = fieldMatch[2].trim();
      const lowerLabel = label.toLowerCase();

      if (lowerLabel.includes("categoria")) {
        category = val;
        currentTarget = null;
      } else if (lowerLabel.includes("descrição")) {
        description = val;
        currentTarget = null;
      } else if (lowerLabel.includes("atributo") || lowerLabel.includes("requisito")) {
        attributes = val;
        currentTarget = null;
      } else if (lowerLabel.includes("habilidade") || lowerLabel.includes("efeito")) {
        currentTarget = "abilities";
        if (val) abilities.push(val);
      } else if (lowerLabel.includes("vantagem") || lowerLabel.includes("benefício")) {
        currentTarget = "advantages";
        if (val) advantages.push(val);
      } else if (lowerLabel.includes("desvantagem") || lowerLabel.includes("custo") || lowerLabel.includes("penalidade")) {
        currentTarget = "disadvantages";
        if (val) disadvantages.push(val);
      } else if (lowerLabel.includes("buff") || lowerLabel.includes("debuff")) {
        buffsDebuffs = val;
        currentTarget = null;
      } else if (lowerLabel.includes("fonte") || lowerLabel.includes("referência") || lowerLabel.includes("livro")) {
        source = val;
        currentTarget = null;
      } else if (lowerLabel.includes("confiança")) {
        confidence = normalizeConfidence(val);
        currentTarget = null;
      } else {
        currentExtraField = { label, value: val, items: [] };
        extraFields.push(currentExtraField);
        currentTarget = "extra";
      }
    } else {
      // Sub-bullet or continuation
      const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/);
      if (bulletMatch) {
        const itemText = bulletMatch[1].trim();
        if (currentTarget === "abilities") {
          abilities.push(itemText);
        } else if (currentTarget === "advantages") {
          advantages.push(itemText);
        } else if (currentTarget === "disadvantages") {
          disadvantages.push(itemText);
        } else if (currentTarget === "extra" && currentExtraField) {
          currentExtraField.items.push(itemText);
        }
      } else if (line.trim().length > 0) {
        // Appended text
        const extraText = line.trim();
        if (currentTarget === "abilities" && abilities.length > 0) {
          abilities[abilities.length - 1] += " " + extraText;
        } else if (currentTarget === "advantages" && advantages.length > 0) {
          advantages[advantages.length - 1] += " " + extraText;
        } else if (currentTarget === "disadvantages" && disadvantages.length > 0) {
          disadvantages[disadvantages.length - 1] += " " + extraText;
        } else if (currentTarget === "extra" && currentExtraField) {
          currentExtraField.value += (currentExtraField.value ? " " : "") + extraText;
        } else if (description && !attributes) {
          description += " " + extraText;
        }
      }
    }
  }

  const cardId = `card-${Date.now()}-${index}-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  return {
    id: cardId,
    name,
    systemEd,
    category,
    description,
    attributes,
    abilities,
    advantages,
    disadvantages,
    buffsDebuffs,
    source,
    confidence,
    extraFields,
    rawText: rawBlock,
  };
}

/**
 * Splits response text into parsed blocks (cards, tables, and prose)
 */
export function parseResponseBlocks(text: string): ParsedBlock[] {
  if (!text) return [];

  // Break text by double newlines or card headers
  const rawSections = text.split(/\n\s*\n+/);
  const blocks: ParsedBlock[] = [];

  let cardIndex = 0;

  for (const section of rawSections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    // Check if section contains markdown table (| Header | Header |)
    const isTable = trimmed.includes("|") && trimmed.split("\n").filter((l) => l.includes("|")).length >= 2;
    if (isTable && !trimmed.startsWith("**") && !trimmed.includes("- **Categoria**:")) {
      blocks.push({ type: "table", content: trimmed });
      continue;
    }

    // Try parsing as card
    const card = parseSingleCardBlock(trimmed, cardIndex);
    if (card) {
      blocks.push({ type: "card", card });
      cardIndex++;
    } else {
      blocks.push({ type: "prose", content: trimmed });
    }
  }

  return blocks;
}
