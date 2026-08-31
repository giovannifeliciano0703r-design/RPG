import { useState } from "react";
import type { ChatMessage, KnowledgeEntry, ParsedRpgCard, RpgSystem } from "../types";
import { STORAGE_KEYS } from "../constants/storageKeys";
import { normalizeRpgSystem } from "../domain/rpgSystems";
import { DEFAULT_KNOWLEDGE_ENTRIES } from "../data/defaultKnowledge";
import { parseResponseBlocks } from "../utils/cardParser";

function readArray<T>(key: string): T[] | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return Array.isArray(value) ? value as T[] : null;
  } catch {
    return null;
  }
}

export function useCodexWorkspace(welcome: string) {
  const [activeSystem, setActiveSystem] = useState<RpgSystem>(() => normalizeRpgSystem(localStorage.getItem(STORAGE_KEYS.system)));
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const stored = readArray<ChatMessage>(STORAGE_KEYS.chatHistory);
    return stored?.length ? stored : [{ id: "msg-init-welcome", role: "assistant", content: welcome, timestamp: Date.now(), blocks: parseResponseBlocks(welcome) }];
  });
  const [savedCards, setSavedCards] = useState<ParsedRpgCard[]>(() => readArray<ParsedRpgCard>(STORAGE_KEYS.grimoire) ?? []);
  const [customKnowledge, setCustomKnowledge] = useState<KnowledgeEntry[]>(() => {
    const stored = readArray<KnowledgeEntry>(STORAGE_KEYS.customKnowledge);
    return stored?.length ? stored : DEFAULT_KNOWLEDGE_ENTRIES;
  });
  return {
    activeSystem, setActiveSystem,
    messages, setMessages,
    savedCards, setSavedCards,
    customKnowledge, setCustomKnowledge,
  };
}
