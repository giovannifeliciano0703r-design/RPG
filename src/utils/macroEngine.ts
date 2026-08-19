import { CharacterSheet, Macro, ParsedMacroExecution } from "../types";
import { calculateDerivedStats } from "./characterCalculations";
import { evaluateArithmetic } from "./safeMath";

export const evaluateDiceFormula = (formula: string): { total: number; individualRolls: number[]; isCrit: boolean; isFumble: boolean } => {
  let isCrit = false; let isFumble = false; const allRolls: number[] = [];
  const resolved = formula.replace(/(\d*)d(\d+)(?:kh(\d+))?/gi, (_, countStr, sidesStr, khStr) => {
    const count = Math.min(Math.max(parseInt(countStr || "1", 10), 1), 100);
    const sides = Math.min(Math.max(parseInt(sidesStr, 10), 2), 1000);
    const keepHigh = Math.min(Math.max(parseInt(khStr || String(count), 10), 1), count);
    const rolls: number[] = [];
    for (let i = 0; i < count; i++) { const roll = Math.floor(Math.random() * sides) + 1; rolls.push(roll); allRolls.push(roll); if (sides === 20) { if (roll === 20) isCrit = true; if (roll === 1) isFumble = true; } }
    rolls.sort((a, b) => b - a);
    return String(rolls.slice(0, keepHigh).reduce((sum, value) => sum + value, 0));
  });
  let total = 0;
  try { total = evaluateArithmetic(resolved); } catch (err) { console.error("Erro ao avaliar fórmula:", formula, err); total = allRolls.reduce((a, b) => a + b, 0); }
  return { total, individualRolls: allRolls, isCrit, isFumble };
};

export const resolveMacroVariables = (rawCommand: string, sheet?: CharacterSheet | null): string => {
  if (!sheet) return rawCommand.replace(/@\{([^}]+)\}/g, "0");
  const derived = calculateDerivedStats(sheet);
  const variables: Record<string, number | string> = {
    "attributes.str": sheet.strength.base + (sheet.strength.tempBonus || 0), "attributes.dex": sheet.dexterity.base + (sheet.dexterity.tempBonus || 0), "attributes.con": sheet.constitution.base + (sheet.constitution.tempBonus || 0), "attributes.int": sheet.intelligence.base + (sheet.intelligence.tempBonus || 0), "attributes.wis": sheet.wisdom.base + (sheet.wisdom.tempBonus || 0), "attributes.cha": sheet.charisma.base + (sheet.charisma.tempBonus || 0),
    "attributes.strMod": derived.strMod, "attributes.dexMod": derived.dexMod, "attributes.conMod": derived.conMod, "attributes.intMod": derived.intMod, "attributes.wisMod": derived.wisMod, "attributes.chaMod": derived.chaMod,
    strMod: derived.strMod, dexMod: derived.dexMod, conMod: derived.conMod, intMod: derived.intMod, wisMod: derived.wisMod, chaMod: derived.chaMod, profBonus: derived.proficiencyBonus, pb: derived.proficiencyBonus, level: sheet.level, lvl: sheet.level, ac: derived.totalAC, ca: derived.totalAC, hp: sheet.currentHp, maxHp: derived.totalMaxHp, initiative: derived.initiative, spellSaveDC: derived.spellSaveDC, spellAttack: derived.spellAttackBonus,
  };
  (sheet.skills || []).forEach((sk) => { const mod = derived.skillModifiers[sk.id || sk.name] ?? 0; const cleanName = sk.name.toLowerCase().replace(/\s+/g, "_"); variables[`skill.${cleanName}`] = mod; variables[`pericia.${cleanName}`] = mod; });
  return rawCommand.replace(/@\{([^}]+)\}/g, (_, key) => String(variables[key.trim()] ?? 0));
};

export const executeMacro = (macro: Macro, sheet?: CharacterSheet | null): ParsedMacroExecution => {
  const resolvedCommand = resolveMacroVariables(macro.command, sheet);
  const rollRegex = /\/(?:roll|r|damage|dano)\s+([^[\n]+)(?:\[([^\]]+)\])?/gi;
  const diceRolls: ParsedMacroExecution["diceRolls"] = []; let match: RegExpExecArray | null; let finalTotal = 0;
  while ((match = rollRegex.exec(resolvedCommand)) !== null) { const formula = match[1].trim(); const result = evaluateDiceFormula(formula); diceRolls.push({ formula, total: result.total, individualRolls: result.individualRolls, isCrit: result.isCrit, isFumble: result.isFumble }); finalTotal += result.total; }
  if (diceRolls.length === 0) { const result = evaluateDiceFormula(resolvedCommand); diceRolls.push({ formula: resolvedCommand, total: result.total, individualRolls: result.individualRolls, isCrit: result.isCrit, isFumble: result.isFumble }); finalTotal = result.total; }
  return { rawCommand: macro.command, resolvedCommand, title: macro.name, diceRolls, finalTotal, outputMessage: `🎲 **${macro.name}** executado por **${sheet ? sheet.name : macro.creatorName}**: Resultado = **${finalTotal}**` };
};

export const DEFAULT_SAMPLE_MACROS: Array<Omit<Macro, "id" | "creatorId" | "creatorName" | "createdAt">> = [
  { name: "Ataque Corpo-a-Corpo", command: "/roll 1d20 + @{strMod} + @{profBonus} [Ataque Espada Longa]\n/damage 1d8 + @{strMod} [Dano Cortante]", category: "Ataques", isShared: true, icon: "Sword", color: "#DFB56C", description: "Rola ataque com Força + Proficiência e dano padrão de arma de uma mão." },
  { name: "Ataque à Distância", command: "/roll 1d20 + @{dexMod} + @{profBonus} [Disparo com Arco]\n/damage 1d6 + @{dexMod} [Dano Perfurante]", category: "Ataques", isShared: true, icon: "Target", color: "#8DAE8F", description: "Disparo usando Destreza com arco curto." },
  { name: "Teste de Iniciativa", command: "/roll 1d20 + @{initiative} [Iniciativa]", category: "Utilidades", isShared: true, icon: "Zap", color: "#C4645A", description: "Rola d20 + bônus de iniciativa do personagem." },
  { name: "Teste de Percepção", command: "/roll 1d20 + @{skill.percepção} [Percepção]", category: "Perícias", isShared: true, icon: "Eye", color: "#7E9FB0", description: "Teste ativo de Sabedoria (Percepção)." },
  { name: "Salvaguarda de Morte", command: "/roll 1d20 [Teste Contra a Morte]", category: "Utilidades", isShared: true, icon: "Skull", color: "#9C7BA8", description: "Teste sem modificadores para estabilizar ou resistir à morte." },
];
