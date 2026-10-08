import Decimal from "decimal.js";

import type { DecimalString } from "@/domain/types";

/**
 * Lectura de números que tipea el usuario.
 * Convención Argentina: coma decimal y punto de miles ("1.250,50" = 1250.50).
 */

const PATRON_MILES = /^[1-9]\d{0,2}(\.\d{3})+$/;
const PATRON_NUMERO = /^-?\d+(\.\d+)?$/;

/**
 * Convierte lo que escribió el usuario al formato interno (punto decimal, sin miles).
 * No valida: si no es un número, devuelve el texto limpio y la validación lo informa.
 *
 * - "12,5"     → "12.5"
 * - "1.250,50" → "1250.50"
 * - "1.250"    → "1250"   (punto seguido de 3 dígitos = miles)
 * - "0.500"    → "0.500"  (empieza en 0: es un decimal)
 */
export function normalizarNumero(texto: string): DecimalString {
  const limpio = texto.replace(/\s+/g, "");
  if (limpio.includes(",")) {
    return limpio.replace(/\./g, "").replace(",", ".");
  }
  if (PATRON_MILES.test(limpio)) {
    return limpio.replace(/\./g, "");
  }
  return limpio;
}

/** Lee un importe ya normalizado. Vacío, con letras o notación científica → null. */
export function leerNumero(valor: DecimalString): Decimal | null {
  const limpio = valor.trim();
  if (!PATRON_NUMERO.test(limpio)) return null;
  return new Decimal(limpio);
}

/** Cantidad vacía (el usuario todavía no escribió nada). */
export function estaVacio(valor: DecimalString): boolean {
  return valor.trim() === "";
}
