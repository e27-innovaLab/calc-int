import Decimal from "decimal.js";

import type { Calculo, DecimalString } from "@/domain/types";

import { calcularResumenCostos } from "./costos";
import { aDecimalString } from "./decimal";
import { leerNumero } from "./numeros";
import { precioSugerido } from "./resumen";

/**
 * Paso 4 «Precio y punto de equilibrio». Funciones puras; los importes salen sin redondear.
 *
 *   Precio sugerido      = costo unitario ÷ (1 − margen)          (margen sobre ventas, 0–99 %)
 *   Margen resultante    = (precio − costo unitario) ÷ precio
 *   Contribución         = precio − CVU
 *   Punto de equilibrio  = costo fijo total ÷ contribución        (unidades, SIEMPRE hacia arriba)
 *   Facturación mínima   = punto de equilibrio (ya redondeado) × precio
 */

type EntradaPrecio = Pick<
  Calculo,
  "configuracion" | "costosFijos" | "costosVariables" | "costosIndirectos" | "trabajoPropio"
>;

export const MARGEN_MAXIMO_PCT = 99;

/** Precio sugerido para un margen en porcentaje (ej.: "40"). Null si falta el costo o el margen no es 0–99. */
export function precioPorMargen(calculo: EntradaPrecio, margenPct: DecimalString): DecimalString | null {
  const { costoUnitario } = calcularResumenCostos(calculo);
  const m = leerNumero(margenPct);
  if (!costoUnitario || !m) return null;
  return precioSugerido(costoUnitario, aDecimalString(m.dividedBy(100)));
}

/** Precio de venta según lo elegido en el paso 4; null si todavía no se puede calcular. */
export function precioElegido(calculo: EntradaPrecio & Pick<Calculo, "precio">): DecimalString | null {
  const { modo, margenPct, precioManual } = calculo.precio;
  if (modo === "margen") return precioPorMargen(calculo, margenPct);
  const p = leerNumero(precioManual);
  return p && p.greaterThan(0) ? aDecimalString(p) : null;
}

export type EstadoEquilibrio =
  /** El volumen mensual alcanza o supera el punto de equilibrio. */
  | "supera"
  /** Hay equilibrio, pero el volumen mensual no lo alcanza. */
  | "bajo"
  /** El precio no cubre ni el costo variable: no existe un punto de equilibrio. */
  | "inalcanzable";

export interface AnalisisPrecio {
  precio: DecimalString;
  /** (precio − costo unitario) ÷ precio × 100. Negativo si se vende por debajo del costo. */
  margenResultantePct: DecimalString;
  /** precio − costo variable unitario. */
  contribucion: DecimalString;
  /** contribución ÷ precio × 100. */
  contribucionPct: DecimalString;
  ingresosTotalesMensual: DecimalString;
  costosTotalesMensual: DecimalString;
  gananciaNetaMensual: DecimalString;
  /** Unidades para cubrir los costos fijos, redondeadas hacia arriba. Null si es inalcanzable. */
  puntoEquilibrioUnidades: DecimalString | null;
  /** Facturación mínima = unidades de equilibrio redondeadas hacia arriba × precio (no se puede vender media unidad; criterio de Data). Null si es inalcanzable. */
  facturacionMinima: DecimalString | null;
  estado: EstadoEquilibrio;
}

/** Analiza un precio contra los costos cargados. Null sin volumen, sin costo unitario o con precio no positivo. */
export function analizarPrecio(calculo: EntradaPrecio, precioUnitario: DecimalString): AnalisisPrecio | null {
  const r = calcularResumenCostos(calculo);
  const precio = leerNumero(precioUnitario);
  const volumen = leerNumero(r.volumenMensual ?? "");
  const costoUnitario = leerNumero(r.costoUnitario ?? "");
  const costoTotal = leerNumero(r.costoTotalMensual ?? "");
  if (!precio || !precio.greaterThan(0) || !volumen || !costoUnitario || !costoTotal) return null;

  const cvu = new Decimal(r.costoVariableUnitario);
  const cft = new Decimal(r.costoFijoTotalMensual);
  const contribucion = precio.minus(cvu);
  const ingresos = precio.times(volumen);

  let puntoEquilibrio: DecimalString | null = null;
  let facturacion: DecimalString | null = null;
  let estado: EstadoEquilibrio = "inalcanzable";

  if (contribucion.greaterThan(0)) {
    const exacto = cft.dividedBy(contribucion);
    const redondeado = exacto.ceil();
    puntoEquilibrio = aDecimalString(redondeado);
    facturacion = aDecimalString(redondeado.times(precio));
    estado = volumen.greaterThanOrEqualTo(redondeado) ? "supera" : "bajo";
  }

  return {
    precio: aDecimalString(precio),
    margenResultantePct: aDecimalString(precio.minus(costoUnitario).dividedBy(precio).times(100)),
    contribucion: aDecimalString(contribucion),
    contribucionPct: aDecimalString(contribucion.dividedBy(precio).times(100)),
    ingresosTotalesMensual: aDecimalString(ingresos),
    costosTotalesMensual: aDecimalString(costoTotal),
    gananciaNetaMensual: aDecimalString(ingresos.minus(costoTotal)),
    puntoEquilibrioUnidades: puntoEquilibrio,
    facturacionMinima: facturacion,
    estado,
  };
}

/** Mensaje según el margen elegido (0–99 %). */
export type NivelMargen = "muy-bajo" | "bajo" | "bueno" | "alto";

export function nivelDeMargen(margenPct: DecimalString): NivelMargen | null {
  const m = leerNumero(margenPct);
  if (!m || m.isNegative() || m.greaterThan(MARGEN_MAXIMO_PCT)) return null;
  if (m.lessThan(15)) return "muy-bajo";
  if (m.lessThan(30)) return "bajo";
  if (m.lessThan(60)) return "bueno";
  return "alto";
}

export interface PuntoGrafico {
  unidades: number;
  ingresos: number;
  costos: number;
}

export interface DatosGrafico {
  /** Extremos de las rectas (en 0 y en `maxUnidades`). */
  puntos: [PuntoGrafico, PuntoGrafico];
  maxUnidades: number;
  maxImporte: number;
  /** Unidades (sin redondear) donde se cruzan ingresos y costos, o null si no se cruzan. */
  cruce: number | null;
}

/**
 * Datos para «Ingresos vs. Costos Totales». Son solo para dibujar, por eso usan `number`:
 * ningún importe que se muestre como cifra sale de acá.
 * El eje llega hasta 1,2 × lo mayor entre el volumen mensual y el punto de equilibrio.
 */
export function datosGrafico(calculo: EntradaPrecio, precioUnitario: DecimalString): DatosGrafico | null {
  const a = analizarPrecio(calculo, precioUnitario);
  const r = calcularResumenCostos(calculo);
  if (!a || !r.volumenMensual) return null;

  const precio = Number(a.precio);
  const cvu = Number(r.costoVariableUnitario);
  const cft = Number(r.costoFijoTotalMensual);
  const equilibrio = a.puntoEquilibrioUnidades ? Number(a.puntoEquilibrioUnidades) : 0;
  const maxUnidades = Math.max(Number(r.volumenMensual), equilibrio) * 1.2;

  const punto = (unidades: number): PuntoGrafico => ({
    unidades,
    ingresos: precio * unidades,
    costos: cft + cvu * unidades,
  });
  const fin = punto(maxUnidades);

  return {
    puntos: [punto(0), fin],
    maxUnidades,
    maxImporte: Math.max(fin.ingresos, fin.costos),
    cruce: precio > cvu ? cft / (precio - cvu) : null,
  };
}
