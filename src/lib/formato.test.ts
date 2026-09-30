import { describe, expect, it } from "vitest";

import { formatearCantidad, formatearMonto } from "./formato";

describe("formatearMonto", () => {
  it("enteros con punto de miles, sin decimales", () => {
    expect(formatearMonto("4220")).toBe("$4.220");
    expect(formatearMonto("496200")).toBe("$496.200");
    expect(formatearMonto("0")).toBe("$0");
  });

  it("redondea a 2 decimales solo al mostrar, con coma decimal", () => {
    expect(formatearMonto("10666.666666")).toBe("$10.666,67");
    expect(formatearMonto("5666.6")).toBe("$5.666,6");
  });

  it("vacío, null o inválido muestran un guion", () => {
    expect(formatearMonto("")).toBe("—");
    expect(formatearMonto(null)).toBe("—");
    expect(formatearMonto(undefined)).toBe("—");
    expect(formatearMonto("abc")).toBe("—");
  });

  it("negativos llevan el signo adelante", () => {
    expect(formatearMonto("-1500")).toBe("-$1.500");
  });
});

describe("formatearCantidad", () => {
  it("sin símbolo y con coma decimal", () => {
    expect(formatearCantidad("120")).toBe("120");
    expect(formatearCantidad("12.5")).toBe("12,5");
    expect(formatearCantidad("1200")).toBe("1.200");
  });

  it("inválido muestra un guion", () => {
    expect(formatearCantidad("")).toBe("—");
  });
});
