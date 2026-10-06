import Decimal from "decimal.js";

import type { Calculo, DecimalString } from "@/domain/types";

import { calcularResumenCostos } from "./costos";
import { aDecimalString } from "./decimal";
import { leerNumero } from "./numeros";

/**
 * Paso 5 «¿Qué pasa si…?». Funciones puras; los importes salen sin redondear.
 *
 * Cada escenario cambia UNA variable respecto de la situación base y deja las demás como están:
 *   - insumos:    el costo variable unitario varía; el precio de venta NO se toca.
 *   - precio:     el precio de venta varía.
 *   - produccion: el volumen mensual (lo que se produce y se vende) varía.
 * Los costos fijos no cambian en ningún escenario.
 */

export type TipoEscenario = "insumos" | "precio" | "produccion";

export const VARIACION_MINIMA_PCT = -50;
export const VARIACION_MAXIMA_PCT = 100;

type EntradaEscenario = Pick<
  Calculo,
  "configuracion" | "costosFijos" | "costosVariables" | "costosIndirectos" | "trabajoPropio"
>;

export interface Situacion {
  costoUnitario: DecimalString;
  precio: DecimalString;
  /** Unidades para cubrir los costos fijos (hacia arriba). Null si el precio no cubre el costo variable. */
  puntoEquilibrio: DecimalString | null;
  /** Ingresos − costos del mes. Puede ser negativa. */
  gananciaMensual: DecimalString;
  /** Ganancia ÷ ingresos × 100. */
  margenNetoPct: DecimalString;
}

interface Bruto extends Situacion {
  /** Punto de equilibrio sin redondear (solo para calcular variaciones). */
  equilibrioExacto: Decimal | null;
}

function calcular(cft: Decimal, cvu: Decimal, volumen: Decimal, precio: Decimal): Bruto {
  const costoTotal = cft.plus(cvu.times(volumen));
  const ingresos = precio.times(volumen);
  const ganancia = ingresos.minus(costoTotal);
  const contribucion = precio.minus(cvu);
  const exacto = contribucion.greaterThan(0) ? cft.dividedBy(contribucion) : null;

  return {
    costoUnitario: aDecimalString(costoTotal.dividedBy(volumen)),
    precio: aDecimalString(precio),
    puntoEquilibrio: exacto ? aDecimalString(exacto.ceil()) : null,
    gananciaMensual: aDecimalString(ganancia),
    margenNetoPct: aDecimalString(ingresos.isZero() ? new Decimal(0) : ganancia.dividedBy(ingresos).times(100)),
    equilibrioExacto: exacto,
  };
}

function aSituacion(b: Bruto): Situacion {
  return {
    costoUnitario: b.costoUnitario,
    precio: b.precio,
    puntoEquilibrio: b.puntoEquilibrio,
    gananciaMensual: b.gananciaMensual,
    margenNetoPct: b.margenNetoPct,
  };
}

function datosBase(calculo: EntradaEscenario, precioUnitario: DecimalString) {
  const r = calcularResumenCostos(calculo);
  const precio = leerNumero(precioUnitario);
  const volumen = leerNumero(r.volumenMensual ?? "");
  if (!precio || !precio.greaterThan(0) || !volumen) return null;
  return { cft: new Decimal(r.costoFijoTotalMensual), cvu: new Decimal(r.costoVariableUnitario), volumen, precio };
}

/** Situación actual con el precio elegido en el paso 4. Null sin volumen o sin precio. */
export function situacionBase(calculo: EntradaEscenario, precioUnitario: DecimalString): Situacion | null {
  const d = datosBase(calculo, precioUnitario);
  if (!d) return null;
  return aSituacion(calcular(d.cft, d.cvu, d.volumen, d.precio));
}

export interface Variaciones {
  /** Cambio porcentual de cada magnitud respecto de la base. Null cuando no se puede calcular. */
  costoUnitarioPct: DecimalString | null;
  precioPct: DecimalString | null;
  equilibrioPct: DecimalString | null;
  gananciaPct: DecimalString | null;
}

export interface ResultadoEscenario extends Situacion {
  variaciones: Variaciones;
}

/** Cambio porcentual de `nuevo` respecto de `base`. Con base cero no hay porcentaje. La base negativa se toma en valor absoluto. */
function cambioPct(nuevo: Decimal, base: Decimal): DecimalString | null {
  if (base.isZero()) return null;
  return aDecimalString(nuevo.minus(base).dividedBy(base.abs()).times(100));
}

/**
 * Simula un escenario. `variacionPct` va de −50 a +100 (se limita a ese rango).
 * Null si falta el volumen o el precio.
 */
export interface VariacionesEscenario {
  /** Cambio porcentual en el costo variable unitario. Sin valor = sin cambio. */
  insumosPct?: DecimalString;
  /** Cambio porcentual en el precio de venta. Sin valor = sin cambio. */
  precioPct?: DecimalString;
  /** Cambio porcentual en el volumen mensual. Sin valor = sin cambio. */
  produccionPct?: DecimalString;
}

/** Factor multiplicador (1 + pct/100) con el pct limitado al rango permitido. Null si el valor no es un número. */
function factorDe(pct: DecimalString | undefined): Decimal | null {
  if (pct === undefined) return new Decimal(1);
  const v = leerNumero(pct);
  if (!v) return null;
  const limitada = Decimal.min(Decimal.max(v, VARIACION_MINIMA_PCT), VARIACION_MAXIMA_PCT);
  return new Decimal(1).plus(limitada.dividedBy(100));
}

/**
 * Simula un escenario que puede mover insumos, precio y volumen a la vez.
 * Cada variación va de −50 a +100 (se limita a ese rango). Null si falta el volumen o el precio,
 * o si alguna variación no es un número.
 */
export function simularVariaciones(
  calculo: EntradaEscenario,
  precioUnitario: DecimalString,
  variaciones: VariacionesEscenario,
): ResultadoEscenario | null {
  const d = datosBase(calculo, precioUnitario);
  const fInsumos = factorDe(variaciones.insumosPct);
  const fPrecio = factorDe(variaciones.precioPct);
  const fProduccion = factorDe(variaciones.produccionPct);
  if (!d || !fInsumos || !fPrecio || !fProduccion) return null;

  const base = calcular(d.cft, d.cvu, d.volumen, d.precio);
  const nuevo = calcular(d.cft, d.cvu.times(fInsumos), d.volumen.times(fProduccion), d.precio.times(fPrecio));
  const exactoNuevo = nuevo.equilibrioExacto;

  return {
    ...aSituacion(nuevo),
    variaciones: {
      costoUnitarioPct: cambioPct(new Decimal(nuevo.costoUnitario), new Decimal(base.costoUnitario)),
      precioPct: cambioPct(new Decimal(nuevo.precio), new Decimal(base.precio)),
      equilibrioPct: exactoNuevo && base.equilibrioExacto ? cambioPct(exactoNuevo, base.equilibrioExacto) : null,
      gananciaPct: cambioPct(new Decimal(nuevo.gananciaMensual), new Decimal(base.gananciaMensual)),
    },
  };
}

/** Un escenario de una sola variable. Se mantiene por compatibilidad: delega en `simularVariaciones`. */
export function simularEscenario(
  calculo: EntradaEscenario,
  precioUnitario: DecimalString,
  tipo: TipoEscenario,
  variacionPct: DecimalString,
): ResultadoEscenario | null {
  return simularVariaciones(calculo, precioUnitario, {
    insumosPct: tipo === "insumos" ? variacionPct : undefined,
    precioPct: tipo === "precio" ? variacionPct : undefined,
    produccionPct: tipo === "produccion" ? variacionPct : undefined,
  });
}

/** Meta de ventas sugerida: al menos 30 % por encima del punto de equilibrio (mismo criterio del consejo del paso 4). */
export function metaDeVentas(puntoEquilibrio: DecimalString | null): DecimalString | null {
  const p = leerNumero(puntoEquilibrio ?? "");
  return p ? aDecimalString(p.times("1.3").ceil()) : null;
}
