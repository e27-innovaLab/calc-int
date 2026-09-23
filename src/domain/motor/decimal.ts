import Decimal from "decimal.js";

import type { DecimalString } from "@/domain/types";

/**
 * Helpers de precisión decimal del motor.
 * Todo cálculo monetario pasa por acá: nunca operar importes con `number`.
 */

/** Convierte un importe cargado por el usuario a Decimal. Vacío o inválido → null. */
export function aDecimal(valor: DecimalString): Decimal | null {
  const limpio = valor.trim();
  if (limpio === "") return null;
  try {
    const d = new Decimal(limpio);
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

/** Suma una lista de importes. Los vacíos o inválidos se ignoran (los reporta la validación). */
export function sumar(valores: DecimalString[]): Decimal {
  return valores.reduce<Decimal>((total, v) => {
    const d = aDecimal(v);
    return d ? total.plus(d) : total;
  }, new Decimal(0));
}

/** Serializa un Decimal al formato interno, sin redondear (el redondeo es solo visual). */
export function aDecimalString(valor: Decimal): DecimalString {
  return valor.toString();
}
