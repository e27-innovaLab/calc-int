import Decimal from "decimal.js";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { POST } from "./route";

/**
 * El endpoint usa el motor oficial: tiene que dar lo mismo que la pantalla en las tres rutas.
 * Casos A, B y C del prompt maestro (datos de prueba del motor, no datos comerciales).
 */

type Cuerpo = Record<string, unknown>;

/** Respuesta del endpoint tal como la lee un cliente: los campos que usan los tests, todos opcionales. */
interface Respuesta {
  success?: boolean;
  error?: string;
  detalle?: unknown;
  errores: { campo: string; mensaje: string }[];
  advertencias?: string[];
  data: Record<string, string> & {
    /** Es null cuando la solicitud no trae `precio`; los tests que lo leen siempre lo envían. */
    precio: Record<string, string | null> & { modo: string };
  };
}

async function enviar(cuerpo: unknown, crudo?: string) {
  const req = new NextRequest("http://localhost/api/v1/calculator/calculate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: crudo ?? JSON.stringify(cuerpo),
  });
  const res = await POST(req);
  return { status: res.status, json: (await res.json()) as Respuesta };
}

const fijo = (monto: string) => ({ id: "f", nombre: "Gastos fijos", categoria: "fijo", monto, frecuencia: "mensual" });
const indirecto = (monto: string) => ({ id: "i", nombre: "Indirectos", categoria: "indirecto", monto, frecuencia: "mensual" });
const variable = (id: string, montoUnitario: string, base?: "unidad" | "lote") => ({
  id,
  nombre: id,
  categoria: "variable",
  montoUnitario,
  ...(base ? { base } : {}),
});

function cercano(obtenido: unknown, esperado: string) {
  expect(typeof obtenido).toBe("string");
  expect(new Decimal(obtenido as string).minus(esperado).abs().lessThan("0.000001")).toBe(true);
}

/** Prueba A: 20 unidades por lote × 5 lotes, 2 hs por lote a $5.000, fijos $30.000, indirectos $10.000, margen 30 %. */
function solicitudA(costosVariables: Cuerpo[]): Cuerpo {
  return {
    configuracion: { tipo: "producto", ruta: "lotes", nombre: "Velas", moneda: "ARS", unidadVenta: "unidad", unidadesPorLote: "20", lotes: "5" },
    costosFijos: [fijo("30000")],
    costosIndirectos: [indirecto("10000")],
    costosVariables,
    trabajoPropio: { incluir: true, horasPorLote: "2", valorHora: "5000" },
    precio: { modo: "margen", margenPct: "30", precioManual: "" },
  };
}

describe("Prueba A — ruta «lotes»", () => {
  it("con el insumo por unidad ($1.000)", async () => {
    const { status, json } = await enviar(solicitudA([variable("cera", "1000")]));
    expect(status).toBe(200);
    expect(json.success).toBe(true);
    const d = json.data;
    expect(d.volumenMensual).toBe("100");
    expect(d.totalTrabajoPropioMensual).toBe("50000");
    expect(d.costoFijoTotalMensual).toBe("90000");
    expect(d.costoVariableUnitario).toBe("1000");
    expect(d.costoUnitario).toBe("1900");
    cercano(d.precio.precio, "2714.285714285714");
    cercano(d.precio.contribucion, "1714.285714285714");
    expect(d.precio.puntoEquilibrioUnidades).toBe("53");
    cercano(d.precio.facturacionMinima, "143857.142857142857");
  });

  it("con el insumo por lote ($20.000 ÷ 20) da exactamente lo mismo", async () => {
    const porUnidad = await enviar(solicitudA([variable("cera", "1000")]));
    const porLote = await enviar(solicitudA([variable("cera", "20000", "lote")]));
    expect(porLote.status).toBe(200);
    expect(porLote.json.data).toEqual(porUnidad.json.data);
  });

  it("mezcla insumos por lote y por unidad sin dividir dos veces los de por unidad", async () => {
    const { json } = await enviar(solicitudA([variable("cera", "20000", "lote"), variable("mecha", "500", "unidad")]));
    cercano(json.data.costoVariableUnitario, "1500");
  });

  it("sin «ruta» se comporta como «lotes» (compatibilidad con quien ya usa el endpoint)", async () => {
    const cuerpo = solicitudA([variable("cera", "1000")]);
    delete (cuerpo.configuracion as Cuerpo).ruta;
    const { status, json } = await enviar(cuerpo);
    expect(status).toBe(200);
    expect(json.data.costoUnitario).toBe("1900");
  });

  it("acepta el volumen y las horas mensuales si coinciden con lo derivado", async () => {
    const cuerpo = solicitudA([variable("cera", "1000")]);
    (cuerpo.configuracion as Cuerpo).volumenMensual = "100";
    (cuerpo.trabajoPropio as Cuerpo).horasMensuales = "10";
    const { status, json } = await enviar(cuerpo);
    expect(status).toBe(200);
    expect(json.data.costoUnitario).toBe("1900");
  });
});

describe("Prueba B — ruta «unidad» (a medida)", () => {
  const cuerpo: Cuerpo = {
    configuracion: { tipo: "producto", ruta: "unidad", nombre: "Mesa", moneda: "ARS", unidadVenta: "unidad", volumenMensual: "10" },
    costosFijos: [fijo("20000")],
    costosIndirectos: [indirecto("10000")],
    costosVariables: [variable("madera", "15000")],
    trabajoPropio: { incluir: true, horasPorLote: "3", valorHora: "4000" },
    precio: { modo: "margen", margenPct: "25", precioManual: "" },
  };

  it("volumen 10, trabajo $120.000, CFT $150.000, costo unitario $30.000, precio $40.000, equilibrio 6", async () => {
    const { status, json } = await enviar(cuerpo);
    expect(status).toBe(200);
    const d = json.data;
    expect(d.volumenMensual).toBe("10");
    expect(d.totalTrabajoPropioMensual).toBe("120000");
    expect(d.costoFijoTotalMensual).toBe("150000");
    expect(d.costoVariableUnitario).toBe("15000");
    expect(d.costoUnitario).toBe("30000");
    expect(d.precio.precio).toBe("40000");
    expect(d.precio.contribucion).toBe("25000");
    expect(d.precio.puntoEquilibrioUnidades).toBe("6");
    expect(d.precio.facturacionMinima).toBe("240000");
  });
});

describe("Prueba C — ruta «reventa» con sueldo mensual directo", () => {
  const cuerpo: Cuerpo = {
    configuracion: { tipo: "producto", ruta: "reventa", nombre: "Termos", moneda: "ARS", unidadVenta: "unidad", volumenMensual: "100" },
    costosFijos: [fijo("50000")],
    costosIndirectos: [indirecto("20000")],
    costosVariables: [variable("compra", "5000"), variable("packaging", "500")],
    trabajoPropio: { incluir: true, sueldoMensual: "300000" },
    precio: { modo: "margen", margenPct: "20", precioManual: "" },
  };

  it("sueldo $300.000 una sola vez: CFT $370.000, CVU $5.500, costo unitario $9.200, precio $11.500", async () => {
    const { status, json } = await enviar(cuerpo);
    expect(status).toBe(200);
    const d = json.data;
    expect(d.totalTrabajoPropioMensual).toBe("300000");
    expect(d.costoFijoTotalMensual).toBe("370000");
    expect(d.costoVariableUnitario).toBe("5500");
    expect(d.costoUnitario).toBe("9200");
    expect(d.precio.precio).toBe("11500");
    expect(d.precio.contribucion).toBe("6000");
    expect(d.precio.puntoEquilibrioUnidades).toBe("62");
    expect(d.precio.facturacionMinima).toBe("713000");
  });

  it("no pide horas ni valor hora, y el sueldo no se multiplica por el volumen", async () => {
    const { json } = await enviar({ ...cuerpo, configuracion: { ...(cuerpo.configuracion as Cuerpo), volumenMensual: "250" } });
    expect(json.data.totalTrabajoPropioMensual).toBe("300000");
  });

  it("ignora horas y valor hora que lleguen en «reventa»", async () => {
    const { json } = await enviar({ ...cuerpo, trabajoPropio: { incluir: true, sueldoMensual: "300000", horasPorLote: "9", valorHora: "9999" } });
    expect(json.data.totalTrabajoPropioMensual).toBe("300000");
  });

  it("sin precio en la solicitud devuelve solo los costos", async () => {
    const sinPrecio: Cuerpo = { ...cuerpo };
    delete sinPrecio.precio;
    const { status, json } = await enviar(sinPrecio);
    expect(status).toBe(200);
    expect(json.data.precio).toBeNull();
    expect(json.data.costoUnitario).toBe("9200");
  });

  it("precio manual: analiza el precio ingresado", async () => {
    const { json } = await enviar({ ...cuerpo, precio: { modo: "manual", margenPct: "", precioManual: "12000" } });
    expect(json.data.precio.modo).toBe("manual");
    expect(json.data.precio.precio).toBe("12000");
    expect(json.data.precio.contribucion).toBe("6500");
    expect(json.data.precio.puntoEquilibrioUnidades).toBe("57");
  });
});

describe("Entradas inválidas: se rechazan, no se reemplazan por cero", () => {
  const base = () => solicitudA([variable("cera", "1000")]);

  it("cuerpo que no es JSON → 400", async () => {
    const { status, json } = await enviar(null, "{esto no es json");
    expect(status).toBe(400);
    expect(json.error).toMatch(/JSON/);
  });

  it("ruta desconocida → 400 de esquema", async () => {
    const cuerpo = base();
    (cuerpo.configuracion as Cuerpo).ruta = "otra";
    const { status, json } = await enviar(cuerpo);
    expect(status).toBe(400);
    expect(json.detalle).toBeTruthy();
  });

  it("volumen cero o inválido en «unidad» no se reemplaza por 1", async () => {
    for (const volumenMensual of ["0", "", "abc", "-5"]) {
      const { status, json } = await enviar({
        ...base(),
        configuracion: { tipo: "producto", ruta: "unidad", nombre: "x", moneda: "ARS", unidadVenta: "unidad", volumenMensual },
      });
      expect(status).toBe(400);
      expect(json.errores.map((e: { campo: string }) => e.campo)).toContain("configuracion.volumenMensual");
    }
  });

  it("unidades por lote o lotes en cero → 400", async () => {
    for (const cambios of [{ unidadesPorLote: "0" }, { lotes: "0" }, { unidadesPorLote: "" }]) {
      const cuerpo = base();
      Object.assign(cuerpo.configuracion as Cuerpo, cambios);
      const { status } = await enviar(cuerpo);
      expect(status).toBe(400);
    }
  });

  it("insumo por lote sin unidades por lote → 400 (no se divide por cero ni se omite)", async () => {
    const cuerpo = solicitudA([variable("cera", "20000", "lote")]);
    (cuerpo.configuracion as Cuerpo).unidadesPorLote = "";
    const { status, json } = await enviar(cuerpo);
    expect(status).toBe(400);
    expect(json.errores.map((e: { campo: string }) => e.campo)).toContain("configuracion.unidadesPorLote");
  });

  it("importes negativos o con formato inválido → 400 con el campo", async () => {
    const negativo = await enviar({ ...base(), costosFijos: [fijo("-50000")] });
    expect(negativo.status).toBe(400);
    expect(negativo.json.errores[0].campo).toBe("costosFijos.0.monto");

    const invalido = await enviar({ ...base(), costosVariables: [variable("cera", "1e15x")] });
    expect(invalido.status).toBe(400);
    expect(invalido.json.errores[0].campo).toBe("costosVariables.0.montoUnitario");
  });

  it("horas o valor hora negativos → 400", async () => {
    const { status } = await enviar({ ...base(), trabajoPropio: { incluir: true, horasPorLote: "-2", valorHora: "5000" } });
    expect(status).toBe(400);
  });

  it("sueldo negativo en «reventa» → 400; sueldo cero es válido", async () => {
    const reventa = (sueldoMensual: string): Cuerpo => ({
      configuracion: { tipo: "producto", ruta: "reventa", nombre: "x", moneda: "ARS", unidadVenta: "unidad", volumenMensual: "100" },
      costosFijos: [fijo("50000")],
      costosIndirectos: [],
      costosVariables: [variable("compra", "5000")],
      trabajoPropio: { incluir: true, sueldoMensual },
    });
    expect((await enviar(reventa("-1"))).status).toBe(400);
    const cero = await enviar(reventa("0"));
    expect(cero.status).toBe(200);
    expect(cero.json.data.totalTrabajoPropioMensual).toBe("0");
  });

  it("incluir el trabajo propio sin enviar el dato → 400, no cuenta cero en silencio", async () => {
    const sinHoras = await enviar({ ...base(), trabajoPropio: { incluir: true } });
    expect(sinHoras.status).toBe(400);
    const sinSueldo = await enviar({
      ...base(),
      configuracion: { tipo: "producto", ruta: "reventa", nombre: "x", moneda: "ARS", unidadVenta: "unidad", volumenMensual: "100" },
      trabajoPropio: { incluir: true },
    });
    expect(sinSueldo.status).toBe(400);
    expect(sinSueldo.json.errores.map((e: { campo: string }) => e.campo)).toContain("trabajoPropio.sueldoMensual");
  });

  it("margen 100 %, mayor o negativo, y precio manual en cero → 400", async () => {
    for (const margenPct of ["100", "150", "-1", "abc"]) {
      const { status, json } = await enviar({ ...base(), precio: { modo: "margen", margenPct, precioManual: "" } });
      expect(status).toBe(400);
      expect(json.errores[0].campo).toBe("precio.margenPct");
    }
    const manual = await enviar({ ...base(), precio: { modo: "manual", margenPct: "", precioManual: "0" } });
    expect(manual.status).toBe(400);
  });

  it("margen 0 % y 99 % son válidos", async () => {
    for (const margenPct of ["0", "99"]) {
      const { status } = await enviar({ ...base(), precio: { modo: "margen", margenPct, precioManual: "" } });
      expect(status).toBe(200);
    }
  });

  it("un volumen o unas horas mensuales que no coinciden con lo derivado → 400", async () => {
    const volumen = base();
    (volumen.configuracion as Cuerpo).volumenMensual = "999";
    const a = await enviar(volumen);
    expect(a.status).toBe(400);
    expect(a.json.errores[0].campo).toBe("configuracion.volumenMensual");

    const horas = base();
    (horas.trabajoPropio as Cuerpo).horasMensuales = "999";
    const b = await enviar(horas);
    expect(b.status).toBe(400);
    expect(b.json.errores[0].campo).toBe("trabajoPropio.horasMensuales");
  });

  it("el nombre vacío de un concepto o del producto no bloquea el cálculo", async () => {
    const cuerpo = base();
    (cuerpo.configuracion as Cuerpo).nombre = "";
    const { status } = await enviar({ ...cuerpo, costosFijos: [{ ...fijo("30000"), nombre: "" }] });
    expect(status).toBe(200);
  });

  it("importes grandes y decimales se calculan exactos", async () => {
    const { status, json } = await enviar({ ...base(), costosFijos: [fijo("1000000000000.50")] });
    expect(status).toBe(200);
    cercano(json.data.totalCostosFijosMensual, "1000000000000.5");
  });

  it("«simulacion» se ignora y se avisa", async () => {
    const { status, json } = await enviar({ ...base(), simulacion: { tipo: "precio", variacionPct: "10" } });
    expect(status).toBe(200);
    expect(json.advertencias).toHaveLength(1);
  });
});
