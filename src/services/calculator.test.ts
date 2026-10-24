import { describe, expect, it } from "vitest";
import { CalculatorService } from "./calculator.js";

describe("CalculatorService - Sprint 2 Tests", () => {
  const tortaInput = {
    configuracion: {
      tipo: "producto" as const,
      nombre: "Torta",
      moneda: "ARS" as const,
      unidadVenta: "unidad",
      unidadesPorLote: "20",
      lotes: "6",
      volumenMensual: "120",
    },
    costosFijos: [{ id: "a", nombre: "Fijos", categoria: "fijo" as const, monto: "15000", frecuencia: "mensual" as const }],
    costosIndirectos: [{ id: "b", nombre: "Comisiones", categoria: "indirecto" as const, monto: "1200", frecuencia: "mensual" as const }],
    trabajoPropio: { incluir: true, horasPorLote: "4", horasMensuales: "24", valorHora: "20000" },
    costosVariables: [{ id: "c", nombre: "Insumos", categoria: "variable" as const, montoUnitario: "85" }],
    precio: { modo: "margen" as const, margenPct: "40", precioManual: "" },
  };

  it("calcula costo unitario $4.220 y punto de equilibrio 72 para el caso Torta", () => {
    const res = CalculatorService.calcular(tortaInput);

    expect(res.resumenCostos.costoUnitario).toBe("4220");
    expect(res.analisisPrecio?.puntoEquilibrioUnidades).toBe("72");
    expect(res.analisisPrecio?.estado).toBe("supera");
  });
});