import { afterEach, describe, expect, it, vi } from "vitest";

import { CONFIGURACION_INICIAL, type Calculo } from "@/domain/types";

import { armarPayloadPdf, descargarPdfDelServidor } from "./exportar-pdf";

// Torta del diseño: 120 u/mes, CFT $496.200, CVU $85, precio $7.033,33 (margen 40 %).
const torta: Calculo = {
  id: "c1",
  configuracion: { ...CONFIGURACION_INICIAL, nombre: "Torta", unidadesPorLote: "20", lotes: "6", volumenMensual: "120" },
  costosFijos: [{ id: "a", nombre: "Fijos", categoria: "fijo", monto: "15000", frecuencia: "mensual" }],
  costosIndirectos: [{ id: "d", nombre: "Comisiones", categoria: "indirecto", monto: "1200", frecuencia: "mensual" }],
  trabajoPropio: { incluir: true, horasPorLote: "4", horasMensuales: "24", valorHora: "20000", sueldoMensual: "", modoSueldo: "fijo", horasAlMes: "" },
  costosVariables: [{ id: "e", nombre: "Insumos", categoria: "variable", montoUnitario: "85" }],
  precio: { modo: "margen", margenPct: "40", precioManual: "" },
  escenarios: [{ id: "e1", nombre: "Suben los insumos", insumosPct: "20", precioPct: "0", produccionPct: "0" }],
  pasoActual: "simulador",
  creadoEn: "2026-11-18T00:00:00.000Z",
  actualizadoEn: "2026-11-18T00:00:00.000Z",
};

describe("armarPayloadPdf", () => {
  it("lleva a números lo que ya calculó el motor (base y escenarios)", () => {
    const p = armarPayloadPdf(torta)!;
    expect(p.nombreProducto).toBe("Torta");
    expect(p.base.costoUnitario).toBe(4220);
    expect(Math.round(p.base.precioVenta)).toBe(7033);
    expect(p.base.puntoEquilibrio).toBe(72);
    expect(Math.round(p.base.gananciaMensual)).toBe(337600);
    expect(p.base.volumenMensual).toBe(120);
    expect(p.escenarios).toHaveLength(1);
    expect(p.escenarios[0].nombre).toBe("Suben los insumos");
    expect(p.escenarios[0].variacionCostos).toBe(20);
    expect(Math.round(p.escenarios[0].gananciaMensual)).toBe(335560);
  });

  it("sin precio calculable no arma nada (el botón usa la impresión del navegador)", () => {
    expect(armarPayloadPdf({ ...torta, configuracion: { ...torta.configuracion, volumenMensual: "" , lotes: "" } })).toBeNull();
  });
});

describe("descargarPdfDelServidor", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("envía el Calculo completo (lo que valida el endpoint), no el resumen", async () => {
    const fetchFalso = vi.fn().mockResolvedValue({ status: 400, ok: false });
    vi.stubGlobal("fetch", fetchFalso);
    const resultado = await descargarPdfDelServidor(torta);
    expect(resultado).toBe("no-disponible");
    const [url, opciones] = fetchFalso.mock.calls[0];
    expect(url).toBe("/api/calculos/exportar-pdf");
    const cuerpo = JSON.parse(opciones.body as string);
    expect(cuerpo.configuracion.nombre).toBe("Torta");
    expect(cuerpo.costosFijos).toHaveLength(1);
    expect(cuerpo.nombreProducto).toBeUndefined();
  });

  it("sin precio calculable no llama al servidor", async () => {
    const fetchFalso = vi.fn();
    vi.stubGlobal("fetch", fetchFalso);
    const sinPrecio = { ...torta, configuracion: { ...torta.configuracion, volumenMensual: "", lotes: "" } };
    expect(await descargarPdfDelServidor(sinPrecio)).toBe("no-disponible");
    expect(fetchFalso).not.toHaveBeenCalled();
  });
});
