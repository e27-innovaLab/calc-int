import { describe, expect, it } from "vitest";

import { estaVacio, leerNumero, normalizarNumero } from "./numeros";

describe("normalizarNumero", () => {
  it("coma decimal pasa a punto", () => {
    expect(normalizarNumero("12,5")).toBe("12.5");
  });

  it("punto de miles + coma decimal", () => {
    expect(normalizarNumero("1.250,50")).toBe("1250.50");
  });

  it("punto seguido de 3 dígitos se lee como miles", () => {
    expect(normalizarNumero("1.250")).toBe("1250");
    expect(normalizarNumero("132.000")).toBe("132000");
    expect(normalizarNumero("1.250.000")).toBe("1250000");
  });

  it("si empieza en 0 el punto es decimal", () => {
    expect(normalizarNumero("0.500")).toBe("0.500");
    expect(normalizarNumero("0,5")).toBe("0.5");
  });

  it("un punto con otra cantidad de decimales se respeta", () => {
    expect(normalizarNumero("12.5")).toBe("12.5");
    expect(normalizarNumero("3.75")).toBe("3.75");
  });

  it("quita espacios y deja pasar texto inválido para que lo informe la validación", () => {
    expect(normalizarNumero(" 1 500 ")).toBe("1500");
    expect(normalizarNumero("abc")).toBe("abc");
  });
});

describe("leerNumero", () => {
  it("lee enteros y decimales", () => {
    expect(leerNumero("1250")?.toString()).toBe("1250");
    expect(leerNumero("1250.5")?.toString()).toBe("1250.5");
  });

  it("devuelve null con vacío, letras, notación científica o infinito", () => {
    expect(leerNumero("")).toBeNull();
    expect(leerNumero("   ")).toBeNull();
    expect(leerNumero("abc")).toBeNull();
    expect(leerNumero("1e5")).toBeNull();
    expect(leerNumero("Infinity")).toBeNull();
    expect(leerNumero("12,5")).toBeNull(); // sin normalizar
  });

  it("acepta negativos (los rechaza la validación, no la lectura)", () => {
    expect(leerNumero("-10")?.toString()).toBe("-10");
  });
});

describe("estaVacio", () => {
  it("reconoce vacío y solo espacios", () => {
    expect(estaVacio("")).toBe(true);
    expect(estaVacio("  ")).toBe(true);
    expect(estaVacio("0")).toBe(false);
  });
});
