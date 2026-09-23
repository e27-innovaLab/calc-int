import type Decimal from "decimal.js";

import type { Frecuencia } from "@/domain/types";

/**
 * Normalización de períodos: el motor trabaja siempre en base mensual.
 * Convención acordada con el equipo: semanal × 4, anual ÷ 12.
 */
export function aMensual(monto: Decimal, frecuencia: Frecuencia): Decimal {
  switch (frecuencia) {
    case "semanal":
      return monto.times(4);
    case "mensual":
      return monto;
    case "anual":
      return monto.dividedBy(12);
  }
}
