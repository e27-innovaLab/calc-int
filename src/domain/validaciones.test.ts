import { describe, expect, it } from "vitest";

import {
  actualizarConcepto,
  actualizarConfiguracion,
  actualizarTrabajoPropio,
  agregarConcepto,
  crearCalculoInicial,
} from "./calculo";
import { configuracionSchema, errorDeMonto, hayErrores, validarConfiguracion, validarCostos } from "./validaciones";

const AHORA = "2026-09-30T12:00:00.000Z";
const config = (cambios: Parameters<typeof actualizarConfiguracion>[1]) =>
  actualizarConfiguracion(crearCalculoInicial(), cambios, AHORA).configuracion;

describe("configuracionSchema / validarConfiguracion", () => {
  const valida = { nombre: "Torta", unidadVenta: "unidad", unidadesPorLote: "20", lotes: "6" };

  it("acepta una configuración completa", () => {
    expect(configuracionSchema.safeParse(valida).success).toBe(true);
  });

  it("el nombre es obligatorio y tiene tope", () => {
    expect(configuracionSchema.safeParse({ ...valida, nombre: "   " }).success).toBe(false);
    expect(configuracionSchema.safeParse({ ...valida, nombre: "x".repeat(81) }).success).toBe(false);
  });

  it("unidades por lote: obligatorio, número y mayor a cero", () => {
    for (const valor of ["", "abc", "0", "-3"]) {
      expect(configuracionSchema.safeParse({ ...valida, unidadesPorLote: valor }).success).toBe(false);
    }
    expect(configuracionSchema.safeParse({ ...valida, unidadesPorLote: "12.5" }).success).toBe(true);
  });

  it("lotes: entero mayor a cero", () => {
    for (const valor of ["", "0", "1.5", "x"]) {
      expect(configuracionSchema.safeParse({ ...valida, lotes: valor }).success).toBe(false);
    }
    expect(configuracionSchema.safeParse({ ...valida, lotes: "6" }).success).toBe(true);
  });

  it("validarConfiguracion informa un error por campo con el campo y el mensaje", () => {
    const errores = validarConfiguracion(config({ nombre: "", unidadesPorLote: "abc", lotes: "0" }));
    expect(errores.map((e) => e.campo).sort()).toEqual([
      "configuracion.lotes",
      "configuracion.nombre",
      "configuracion.unidadesPorLote",
    ]);
    expect(errores.every((e) => e.severidad === "error")).toBe(true);
  });

  it("vacío y sin datos: mensajes claros, sin duplicados", () => {
    const errores = validarConfiguracion(config({}));
    const porCampo = errores.filter((e) => e.campo === "configuracion.unidadesPorLote");
    expect(porCampo).toHaveLength(1);
    expect(porCampo[0].mensaje).toMatch(/unidades/);
  });

  it("configuración válida: sin errores", () => {
    expect(validarConfiguracion(config({ nombre: "Torta", unidadesPorLote: "20", lotes: "6" }))).toEqual([]);
  });
});

describe("errorDeMonto", () => {
  it("válido: null", () => {
    expect(errorDeMonto("1500")).toBeNull();
    expect(errorDeMonto("0")).toBeNull();
    expect(errorDeMonto("12.5")).toBeNull();
  });

  it("vacío, negativo o no numérico: mensaje", () => {
    expect(errorDeMonto("")).toMatch(/monto/i);
    expect(errorDeMonto("-5")).toMatch(/negativo/i);
    expect(errorDeMonto("abc")).toMatch(/números/i);
    expect(errorDeMonto("1e5")).toMatch(/números/i);
  });
});

describe("validarCostos", () => {
  const conCostos = () => {
    let c = crearCalculoInicial();
    c = actualizarConcepto(c, "fijo", "fijo-inicial", { nombre: "Alquiler", monto: "60000" }, AHORA);
    c = actualizarConcepto(c, "variable", "variable-inicial", { nombre: "Harina", montoUnitario: "60" }, AHORA);
    return actualizarTrabajoPropio(c, { horasPorLote: "4", valorHora: "3000" }, AHORA);
  };

  it("todo completo: sin errores ni advertencias", () => {
    expect(validarCostos(conCostos())).toEqual([]);
  });

  it("las filas en blanco se ignoran", () => {
    const c = agregarConcepto(conCostos(), "fijo", "f2", AHORA);
    expect(hayErrores(validarCostos(c))).toBe(false);
  });

  it("fila con monto pero sin nombre: error en el nombre", () => {
    const c = actualizarConcepto(conCostos(), "fijo", "fijo-inicial", { nombre: "" }, AHORA);
    const errores = validarCostos(c);
    expect(errores).toContainEqual(expect.objectContaining({ campo: "costosFijos.0.nombre", severidad: "error" }));
  });

  it("fila con nombre pero sin monto: error en el monto", () => {
    const c = actualizarConcepto(conCostos(), "variable", "variable-inicial", { montoUnitario: "" }, AHORA);
    expect(validarCostos(c)).toContainEqual(
      expect.objectContaining({ campo: "costosVariables.0.montoUnitario", severidad: "error" }),
    );
  });

  it("monto negativo o inválido es error; cero es válido", () => {
    let c = actualizarConcepto(conCostos(), "fijo", "fijo-inicial", { monto: "-1" }, AHORA);
    expect(hayErrores(validarCostos(c))).toBe(true);
    c = actualizarConcepto(conCostos(), "fijo", "fijo-inicial", { monto: "abc" }, AHORA);
    expect(hayErrores(validarCostos(c))).toBe(true);
    c = actualizarConcepto(conCostos(), "fijo", "fijo-inicial", { monto: "0" }, AHORA);
    expect(hayErrores(validarCostos(c))).toBe(false);
  });

  it("trabajo propio: si carga un dato tiene que cargar los dos", () => {
    const soloHoras = actualizarTrabajoPropio(conCostos(), { valorHora: "" }, AHORA);
    expect(validarCostos(soloHoras)).toContainEqual(
      expect.objectContaining({ campo: "trabajoPropio.valorHora", severidad: "error" }),
    );
    const soloValor = actualizarTrabajoPropio(conCostos(), { horasPorLote: "" }, AHORA);
    expect(validarCostos(soloValor)).toContainEqual(
      expect.objectContaining({ campo: "trabajoPropio.horasPorLote", severidad: "error" }),
    );
  });

  it("advertencias (no bloquean) cuando falta cargar costos o el tiempo propio", () => {
    const errores = validarCostos(crearCalculoInicial());
    expect(hayErrores(errores)).toBe(false);
    expect(errores.map((e) => e.campo).sort()).toEqual(["costosFijos", "costosVariables", "trabajoPropio"]);
    expect(errores.every((e) => e.severidad === "advertencia")).toBe(true);
  });
});
