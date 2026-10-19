import Decimal from "decimal.js";

import type {
  Calculo,
  ConceptoCosto,
  CostoVariable,
  DecimalString,
  Frecuencia,
} from "@/domain/types";

import { aDecimalString } from "./decimal";
import { leerNumero } from "./numeros";
import { aMensual } from "./periodo";

/**
 * Resumen de costos del recorrido. Funciones puras, sin React.
 * Todos los importes salen sin redondear: el redondeo es solo visual.
 *
 * Fórmulas (Data, «Glosario - Reglas de negocio»):
 *   Costo Fijo Total = gastos fijos + costos indirectos + trabajo propio   (todo mensual)
 *   CVU              = suma de los insumos variables por unidad
 *   Costo Total      = Costo Fijo Total + CVU × volumen mensual
 *   Costo Unitario   = Costo Total ÷ volumen mensual
 */

const CERO = new Decimal(0);

/** Importe válido (número, no negativo). Lo demás cuenta como cero: lo informa la validación. */
export function importeValido(valor: DecimalString): Decimal {
  const d = leerNumero(valor);
  return d && !d.isNegative() ? d : CERO;
}

/** Monto de un concepto por período, normalizado a mensual. */
export function montoMensual(monto: DecimalString, frecuencia: Frecuencia): Decimal {
  return aMensual(importeValido(monto), frecuencia);
}

function sumarPorPeriodo(conceptos: Extract<ConceptoCosto, { frecuencia: Frecuencia }>[]): Decimal {
  return conceptos.reduce((total, c) => total.plus(montoMensual(c.monto, c.frecuencia)), CERO);
}

function sumarVariables(conceptos: CostoVariable[]): Decimal {
  return conceptos.reduce((total, c) => total.plus(importeValido(c.montoUnitario)), CERO);
}

/** Unidades por mes = unidades por lote × lotes. Vacío si falta alguno o no son números. */
export function volumenDesdeLotes(unidadesPorLote: DecimalString, lotes: DecimalString): DecimalString {
  const u = leerNumero(unidadesPorLote);
  const l = leerNumero(lotes);
  return u && l ? aDecimalString(u.times(l)) : "";
}

/** Horas por mes = horas por lote × lotes. Vacío si falta alguno o no son números. */
export function horasMensualesDesdeLotes(horasPorLote: DecimalString, lotes: DecimalString): DecimalString {
  const h = leerNumero(horasPorLote);
  const l = leerNumero(lotes);
  return h && l ? aDecimalString(h.times(l)) : "";
}

export interface ResumenCostos {
  /** Gastos fijos mensuales (alquiler, servicios…). */
  totalGastosFijosMensual: DecimalString;
  /** Otros costos indirectos, tratados como fijos del mes. */
  totalIndirectosMensual: DecimalString;
  /** Valor del tiempo propio por mes (horas mensuales × valor por hora). */
  totalTrabajoPropioMensual: DecimalString;
  /** Gastos fijos + indirectos + trabajo propio. */
  costoFijoTotalMensual: DecimalString;
  /** Suma de insumos variables por unidad. */
  costoVariableUnitario: DecimalString;
  /** Unidades por mes (> 0), o null si todavía no está definido. */
  volumenMensual: DecimalString | null;
  /** Costo total del mes; null sin volumen. */
  costoTotalMensual: DecimalString | null;
  /** Costo total ÷ volumen; null sin volumen. */
  costoUnitario: DecimalString | null;
  /** Hay algún costo fijo, indirecto o de trabajo propio cargado (> 0). */
  tieneCostosFijos: boolean;
  /** Hay algún insumo variable cargado (> 0). */
  tieneCostosVariables: boolean;
}

type EntradaResumen = Pick<
  Calculo,
  "configuracion" | "costosFijos" | "costosVariables" | "costosIndirectos" | "trabajoPropio"
>;

export function calcularResumenCostos(calculo: EntradaResumen): ResumenCostos {
  const gastosFijos = sumarPorPeriodo(calculo.costosFijos);
  const indirectos = sumarPorPeriodo(calculo.costosIndirectos);

  const { trabajoPropio } = calculo;
  const trabajo = trabajoPropio.incluir
    ? importeValido(trabajoPropio.horasMensuales).times(importeValido(trabajoPropio.valorHora))
    : CERO;

  const costoFijoTotal = gastosFijos.plus(indirectos).plus(trabajo);
  const cvu = sumarVariables(calculo.costosVariables);

  const volumen = leerNumero(calculo.configuracion.volumenMensual);
  const volumenValido = volumen && volumen.isPositive() && !volumen.isZero() ? volumen : null;

  const costoTotal = volumenValido ? costoFijoTotal.plus(cvu.times(volumenValido)) : null;
  const costoUnitario = costoTotal && volumenValido ? costoTotal.dividedBy(volumenValido) : null;

  return {
    totalGastosFijosMensual: aDecimalString(gastosFijos),
    totalIndirectosMensual: aDecimalString(indirectos),
    totalTrabajoPropioMensual: aDecimalString(trabajo),
    costoFijoTotalMensual: aDecimalString(costoFijoTotal),
    costoVariableUnitario: aDecimalString(cvu),
    volumenMensual: volumenValido ? aDecimalString(volumenValido) : null,
    costoTotalMensual: costoTotal ? aDecimalString(costoTotal) : null,
    costoUnitario: costoUnitario ? aDecimalString(costoUnitario) : null,
    tieneCostosFijos: costoFijoTotal.greaterThan(0),
    tieneCostosVariables: cvu.greaterThan(0),
  };
}
