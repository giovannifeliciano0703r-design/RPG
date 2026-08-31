import { describe, expect, it } from "vitest";
import { evaluateArithmetic } from "./safeMath";

describe("evaluateArithmetic", () => {
  it("respects precedence, parentheses and unary operators", () => {
    expect(evaluateArithmetic("2 + 3 * (4 - 1)")).toBe(11);
    expect(evaluateArithmetic("-(2 + 3) * 2")).toBe(-10);
  });

  it("rounds the final macro result", () => {
    expect(evaluateArithmetic("5 / 2")).toBe(3);
  });

  it("rejects executable text and malformed values", () => {
    expect(() => evaluateArithmetic("globalThis.process.exit()")).toThrow("Fórmula inválida");
    expect(() => evaluateArithmetic("1..2 + 3")).toThrow("Número inválido");
    expect(() => evaluateArithmetic("1 / 0")).toThrow("Divisão por zero");
  });

  it("limits parser input and nesting depth", () => {
    expect(() => evaluateArithmetic("1+".repeat(200) + "1")).toThrow("Fórmula inválida");
    expect(() => evaluateArithmetic("(".repeat(40) + "1" + ")".repeat(40))).toThrow("Fórmula muito profunda");
  });
});
