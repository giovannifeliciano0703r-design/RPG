/**
 * Evaluates the small arithmetic language used by RPG macros without eval/new Function.
 * Supported: numbers, +, -, *, / and parentheses.
 */
export function evaluateArithmetic(expression: string): number {
  const input = expression.replace(/\s+/g, "");
  if (!input || !/^[0-9+\-*/().]+$/.test(input)) throw new Error("Fórmula inválida");

  let index = 0;
  const peek = () => input[index] ?? "";
  const consume = () => input[index++];

  function parseExpression(): number {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = consume();
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = consume();
      const rhs = parseFactor();
      if (op === "/" && rhs === 0) throw new Error("Divisão por zero");
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  }

  function parseFactor(): number {
    if (peek() === "+") { consume(); return parseFactor(); }
    if (peek() === "-") { consume(); return -parseFactor(); }
    if (peek() === "(") {
      consume();
      const value = parseExpression();
      if (consume() !== ")") throw new Error("Parêntese não fechado");
      return value;
    }
    const start = index;
    while (/[0-9.]/.test(peek())) consume();
    if (start === index) throw new Error("Número esperado");
    const value = Number(input.slice(start, index));
    if (!Number.isFinite(value)) throw new Error("Número inválido");
    return value;
  }

  const result = parseExpression();
  if (index !== input.length) throw new Error("Fórmula inválida");
  return Math.round(result);
}
