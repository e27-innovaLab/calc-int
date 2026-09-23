import { describe, expect, it } from "vitest";

import { aDecimal, aDecimalString, sumar } from "./decimal";

describe("aDecimal", () => {
  it("convierte importes válidos", () => {
    expect(aDecimal("1250.50")?.toString()).toBe("1250.5");
    expect(aDecimal("  10 ")?.toString()).toBe("10");
  });

  it("devuelve null para vacíos o inválidos", () => {
    expect(aDecimal("")).toBeNull();
    expect(aDecimal("   ")).toBeNull();
    expect(aDecimal("abc")).toBeNull();
    expect(aDecimal("Infinity")).toBeNull();
  });
});

describe("sumar", () => {
  it("no pierde precisión como number", () => {
    expect(aDecimalString(sumar(["0.1", "0.2"]))).toBe("0.3");
  });

  it("ignora valores vacíos o inválidos", () => {
    expect(aDecimalString(sumar(["100", "", "x", "50.25"]))).toBe("150.25");
  });

  it("una lista vacía suma 0", () => {
    expect(aDecimalString(sumar([]))).toBe("0");
  });
});
