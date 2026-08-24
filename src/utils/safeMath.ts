/** Evaluates the arithmetic language accepted by RPG macros without eval/new Function. */
export function evaluateArithmetic(expression: string): number {
  const input = expression.replace(/\s+/g, "");
  if (!input || input.length > 256 || !/^[0-9+\-*/().]+$/.test(input)) throw new Error("Fórmula inválida");
  let index = 0;
  let depth = 0;
  const peek = () => input[index] ?? "";
  const consume = () => input[index++];
  function expressionParser(): number { let value = term(); while (peek() === "+" || peek() === "-") { const op = consume(); const rhs = term(); value = op === "+" ? value + rhs : value - rhs; } return value; }
  function term(): number { let value = factor(); while (peek() === "*" || peek() === "/") { const op = consume(); const rhs = factor(); if (op === "/" && rhs === 0) throw new Error("Divisão por zero"); value = op === "*" ? value * rhs : value / rhs; } return value; }
  function factor(): number {
    if (peek() === "+") { consume(); return factor(); }
    if (peek() === "-") { consume(); return -factor(); }
    if (peek() === "(") {
      if (++depth > 32) throw new Error("Fórmula muito profunda");
      consume();
      const value = expressionParser();
      if (consume() !== ")") throw new Error("Parêntese não fechado");
      depth -= 1;
      return value;
    }
    const start = index; while (/[0-9.]/.test(peek())) consume(); if (start === index) throw new Error("Número esperado");
    const value = Number(input.slice(start, index)); if (!Number.isFinite(value)) throw new Error("Número inválido"); return value;
  }
  const result = expressionParser();
  if (index !== input.length) throw new Error("Fórmula inválida");
  return Math.round(result);
}
