import { describe, expect, it } from "vitest";

import {
  actualizarConcepto,
  actualizarConfiguracion,
  actualizarEscenario,
  actualizarTrabajoPropio,
  agregarConcepto,
  agregarEscenario,
  cambiarPaso,
  crearCalculoInicial,
  duplicarEscenario,
  eliminarConcepto,
  eliminarEscenario,
} from "./calculo";
import { MAX_ESCENARIOS } from "./types";

const AHORA = "2026-09-30T12:00:00.000Z";

describe("crearCalculoInicial", () => {
  it("arranca con una fila en blanco de fijos y de variables, y sin indirectos", () => {
    const c = crearCalculoInicial();
    expect(c.costosFijos).toHaveLength(1);
    expect(c.costosVariables).toHaveLength(1);
    expect(c.costosIndirectos).toHaveLength(0);
    expect(c.pasoActual).toBe("configuracion");
    expect(c.configuracion.lotes).toBe("1");
  });

  it("es determinístico (mismo estado en servidor y cliente)", () => {
    expect(crearCalculoInicial()).toEqual(crearCalculoInicial());
  });
});

describe("actualizarConfiguracion", () => {
  it("el volumen mensual sale de unidades por lote × lotes", () => {
    const c = actualizarConfiguracion(crearCalculoInicial(), { unidadesPorLote: "20", lotes: "6" }, AHORA);
    expect(c.configuracion.volumenMensual).toBe("120");
  });

  it("queda vacío mientras falte un dato", () => {
    const c = actualizarConfiguracion(crearCalculoInicial(), { unidadesPorLote: "20", lotes: "" }, AHORA);
    expect(c.configuracion.volumenMensual).toBe("");
  });

  it("cambiar los lotes también recalcula las horas mensuales del trabajo propio", () => {
    let c = actualizarTrabajoPropio(crearCalculoInicial(), { horasPorLote: "4", valorHora: "20000" }, AHORA);
    c = actualizarConfiguracion(c, { lotes: "6" }, AHORA);
    expect(c.trabajoPropio.horasMensuales).toBe("24");
  });

  it("no muta el estado anterior", () => {
    const antes = crearCalculoInicial();
    actualizarConfiguracion(antes, { nombre: "Torta" }, AHORA);
    expect(antes.configuracion.nombre).toBe("");
  });

  it("registra la fecha de creación la primera vez y la de modificación siempre", () => {
    const primero = actualizarConfiguracion(crearCalculoInicial(), { nombre: "A" }, AHORA);
    expect(primero.creadoEn).toBe(AHORA);
    const segundo = actualizarConfiguracion(primero, { nombre: "B" }, "2026-10-01T10:00:00.000Z");
    expect(segundo.creadoEn).toBe(AHORA);
    expect(segundo.actualizadoEn).toBe("2026-10-01T10:00:00.000Z");
  });
});

describe("actualizarTrabajoPropio", () => {
  it("incluye el tiempo apenas se completa alguno de los dos datos", () => {
    const base = crearCalculoInicial();
    expect(base.trabajoPropio.incluir).toBe(false);
    expect(actualizarTrabajoPropio(base, { horasPorLote: "5" }, AHORA).trabajoPropio.incluir).toBe(true);
    expect(actualizarTrabajoPropio(base, { valorHora: "3000" }, AHORA).trabajoPropio.incluir).toBe(true);
  });

  it("deja de incluirlo si se vacían los dos", () => {
    let c = actualizarTrabajoPropio(crearCalculoInicial(), { horasPorLote: "5", valorHora: "3000" }, AHORA);
    c = actualizarTrabajoPropio(c, { horasPorLote: "", valorHora: "" }, AHORA);
    expect(c.trabajoPropio.incluir).toBe(false);
  });
});

describe("conceptos de costo", () => {
  it("agrega un concepto a cada lista con su categoría", () => {
    let c = crearCalculoInicial();
    c = agregarConcepto(c, "fijo", "f2", AHORA, "Internet");
    c = agregarConcepto(c, "indirecto", "i1", AHORA, "Comisiones");
    c = agregarConcepto(c, "variable", "v2", AHORA);
    expect(c.costosFijos.map((x) => x.id)).toEqual(["fijo-inicial", "f2"]);
    expect(c.costosFijos[1]).toMatchObject({ categoria: "fijo", nombre: "Internet", monto: "", frecuencia: "mensual" });
    expect(c.costosIndirectos[0]).toMatchObject({ categoria: "indirecto", nombre: "Comisiones" });
    expect(c.costosVariables[1]).toMatchObject({ categoria: "variable", montoUnitario: "" });
  });

  it("actualiza solo el concepto indicado", () => {
    let c = agregarConcepto(crearCalculoInicial(), "fijo", "f2", AHORA);
    c = actualizarConcepto(c, "fijo", "f2", { nombre: "Alquiler", monto: "60000" }, AHORA);
    expect(c.costosFijos[0].nombre).toBe("");
    expect(c.costosFijos[1]).toMatchObject({ nombre: "Alquiler", monto: "60000" });
  });

  it("en variables actualiza montoUnitario", () => {
    const c = actualizarConcepto(
      crearCalculoInicial(),
      "variable",
      "variable-inicial",
      { nombre: "Harina", montoUnitario: "60" },
      AHORA,
    );
    expect(c.costosVariables[0]).toMatchObject({ nombre: "Harina", montoUnitario: "60" });
  });

  it("elimina un concepto por id", () => {
    let c = agregarConcepto(crearCalculoInicial(), "variable", "v2", AHORA);
    c = eliminarConcepto(c, "variable", "variable-inicial", AHORA);
    expect(c.costosVariables.map((x) => x.id)).toEqual(["v2"]);
  });
});

describe("cambiarPaso", () => {
  it("guarda el paso en el que quedó el usuario", () => {
    expect(cambiarPaso(crearCalculoInicial(), "costos", AHORA).pasoActual).toBe("costos");
  });
});

describe("escenarios del simulador", () => {
  it("el borrador arranca con los 3 escenarios de siempre, con ids distintos", () => {
    const c = crearCalculoInicial();
    expect(c.escenarios.map((e) => e.nombre)).toEqual(["Suba de insumos", "Cambio de precio", "Más producción"]);
    expect(new Set(c.escenarios.map((e) => e.id)).size).toBe(3);
    expect(c.escenarios[0]).toMatchObject({ insumosPct: "20", precioPct: "0", produccionPct: "0" });
  });

  it("agrega un escenario sin cambios al final", () => {
    const c = agregarEscenario(crearCalculoInicial(), "nuevo", AHORA);
    expect(c.escenarios).toHaveLength(4);
    expect(c.escenarios[3]).toEqual({
      id: "nuevo",
      nombre: "Escenario 4",
      insumosPct: "0",
      precioPct: "0",
      produccionPct: "0",
    });
  });

  it("no agrega ni duplica más allá del máximo", () => {
    let c = crearCalculoInicial();
    for (let i = 0; i < MAX_ESCENARIOS; i++) c = agregarEscenario(c, `extra-${i}`, AHORA);
    expect(c.escenarios).toHaveLength(MAX_ESCENARIOS);
    expect(agregarEscenario(c, "otro", AHORA)).toBe(c);
    expect(duplicarEscenario(c, "escenario-precio", "copia", AHORA)).toBe(c);
  });

  it("duplica un escenario: mismos valores, id nuevo y a continuación del original", () => {
    const c = duplicarEscenario(crearCalculoInicial(), "escenario-insumos", "copia", AHORA);
    expect(c.escenarios.map((e) => e.id)).toEqual([
      "escenario-insumos",
      "copia",
      "escenario-precio",
      "escenario-produccion",
    ]);
    expect(c.escenarios[1]).toMatchObject({ nombre: "Suba de insumos (copia)", insumosPct: "20" });
  });

  it("duplicar un escenario que no existe no cambia nada", () => {
    const c = crearCalculoInicial();
    expect(duplicarEscenario(c, "no-existe", "copia", AHORA)).toBe(c);
  });

  it("actualiza solo el escenario indicado y solo los campos que se mandan", () => {
    const c = actualizarEscenario(
      crearCalculoInicial(),
      "escenario-precio",
      { nombre: "Subo precio", insumosPct: "10" },
      AHORA,
    );
    expect(c.escenarios[1]).toEqual({
      id: "escenario-precio",
      nombre: "Subo precio",
      insumosPct: "10",
      precioPct: "15",
      produccionPct: "0",
    });
    expect(c.escenarios[0]).toEqual(crearCalculoInicial().escenarios[0]);
    expect(c.escenarios[2]).toEqual(crearCalculoInicial().escenarios[2]);
  });

  it("elimina un escenario por id", () => {
    const c = eliminarEscenario(crearCalculoInicial(), "escenario-precio", AHORA);
    expect(c.escenarios.map((e) => e.id)).toEqual(["escenario-insumos", "escenario-produccion"]);
  });

  it("no muta el estado anterior", () => {
    const antes = crearCalculoInicial();
    actualizarEscenario(antes, "escenario-insumos", { insumosPct: "50" }, AHORA);
    eliminarEscenario(antes, "escenario-insumos", AHORA);
    expect(antes.escenarios).toHaveLength(3);
    expect(antes.escenarios[0].insumosPct).toBe("20");
  });
});