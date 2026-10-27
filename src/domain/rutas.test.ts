import { describe, expect, it } from "vitest";

import {
  actualizarConfiguracion,
  actualizarTrabajoPropio,
  cambiarRuta,
  crearCalculoInicial,
} from "./calculo";
import { calcularResumenCostos } from "./motor/costos";
import { MENSAJES_RUTA, validarConfiguracion, validarCostos } from "./validaciones";

const AHORA = "2026-10-26T12:00:00.000Z";

describe("cambiarRuta", () => {
  it("arranca en «lotes»", () => {
    expect(crearCalculoInicial().configuracion.ruta).toBe("lotes");
  });

  it("elegir la misma ruta no cambia nada", () => {
    const c = crearCalculoInicial();
    expect(cambiarRuta(c, "lotes", AHORA)).toBe(c);
  });

  it("de «lotes» a «unidad» deja 1 unidad por lote y vacía volumen y horas (regla del 1)", () => {
    let c = actualizarConfiguracion(crearCalculoInicial(), { unidadesPorLote: "24", lotes: "2" }, AHORA);
    c = actualizarTrabajoPropio(c, { horasPorLote: "4", valorHora: "3000" }, AHORA);
    c = cambiarRuta(c, "unidad", AHORA);

    expect(c.configuracion.ruta).toBe("unidad");
    expect(c.configuracion.unidadesPorLote).toBe("1");
    expect(c.configuracion.lotes).toBe("");
    expect(c.configuracion.volumenMensual).toBe("");
    expect(c.trabajoPropio.horasPorLote).toBe("");
    expect(c.trabajoPropio.valorHora).toBe("3000");
  });

  it("entre «unidad» y «reventa» conserva el volumen y las horas", () => {
    let c = cambiarRuta(crearCalculoInicial(), "unidad", AHORA);
    c = actualizarConfiguracion(c, { lotes: "80" }, AHORA);
    c = actualizarTrabajoPropio(c, { horasPorLote: "0.5" }, AHORA);
    c = cambiarRuta(c, "reventa", AHORA);

    expect(c.configuracion.ruta).toBe("reventa");
    expect(c.configuracion.lotes).toBe("80");
    expect(c.configuracion.volumenMensual).toBe("80");
    expect(c.trabajoPropio.horasPorLote).toBe("0.5");
  });

  it("de una ruta directa a «lotes» vuelve a pedir las unidades por lote", () => {
    let c = cambiarRuta(crearCalculoInicial(), "reventa", AHORA);
    c = actualizarConfiguracion(c, { lotes: "80" }, AHORA);
    c = cambiarRuta(c, "lotes", AHORA);

    expect(c.configuracion.unidadesPorLote).toBe("");
    expect(c.configuracion.lotes).toBe("1");
    expect(c.configuracion.volumenMensual).toBe("");
  });

  it("el volumen mensual de una ruta directa es el total cargado", () => {
    let c = cambiarRuta(crearCalculoInicial(), "unidad", AHORA);
    c = actualizarConfiguracion(c, { lotes: "80" }, AHORA);
    expect(c.configuracion.volumenMensual).toBe("80");
  });

  it("las horas por unidad se multiplican por el total de unidades", () => {
    let c = cambiarRuta(crearCalculoInicial(), "reventa", AHORA);
    c = actualizarConfiguracion(c, { lotes: "80" }, AHORA);
    c = actualizarTrabajoPropio(c, { horasPorLote: "0.5", valorHora: "2000" }, AHORA);

    // 0,5 h × $2.000/h × 80 ventas = $80.000 por mes
    expect(calcularResumenCostos(c).totalTrabajoPropioMensual).toBe("80000");
  });
});

describe("validaciones según la ruta", () => {
  const conRuta = (ruta: "lotes" | "unidad" | "reventa", cambios = {}) =>
    actualizarConfiguracion(cambiarRuta(crearCalculoInicial(), ruta, AHORA), { nombre: "Vela", ...cambios }, AHORA)
      .configuracion;

  it("«unidad» no pide unidades por lote y pregunta por unidades por mes", () => {
    const errores = validarConfiguracion(conRuta("unidad"));
    expect(errores.map((e) => e.campo)).toEqual(["configuracion.lotes"]);
    expect(errores[0].mensaje).toBe(MENSAJES_RUTA.unidad.volumenVacio);
  });

  it("«reventa» habla de ventas", () => {
    const errores = validarConfiguracion(conRuta("reventa"));
    expect(errores[0].mensaje).toBe("Indicá cuántas unidades vendés por mes.");
  });

  it("«lotes» sigue pidiendo unidades por lote y lotes", () => {
    const campos = validarConfiguracion(conRuta("lotes", { lotes: "" })).map((e) => e.campo);
    expect(campos).toEqual(["configuracion.unidadesPorLote", "configuracion.lotes"]);
  });

  it("con el volumen cargado, las rutas directas quedan válidas", () => {
    expect(validarConfiguracion(conRuta("unidad", { lotes: "80" }))).toEqual([]);
    expect(validarConfiguracion(conRuta("reventa", { lotes: "80" }))).toEqual([]);
  });

  it("el mensaje de horas vacías cambia con la ruta", () => {
    for (const ruta of ["lotes", "unidad", "reventa"] as const) {
      let c = cambiarRuta(crearCalculoInicial(), ruta, AHORA);
      c = actualizarTrabajoPropio(c, { incluir: true, horasPorLote: "", valorHora: "1000" }, AHORA);
      const error = validarCostos(c).find((e) => e.campo === "trabajoPropio.horasPorLote");
      expect(error?.mensaje).toBe(MENSAJES_RUTA[ruta].horasVacias);
    }
  });
});
