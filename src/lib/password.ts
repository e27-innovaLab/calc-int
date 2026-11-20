import { z } from "zod";

/**
 * Requisitos de la contraseña, en un solo lugar para usarlos en el formulario (y mostrarlos al usuario).
 * El servidor (Better Auth) exige el largo mínimo; la complejidad se valida acá, en el formulario de registro.
 */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export const REQUISITOS_PASSWORD = [
  `Al menos ${PASSWORD_MIN} caracteres`,
  "Al menos una letra",
  "Al menos un número",
];

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`)
  .max(PASSWORD_MAX, `La contraseña es demasiado larga (máximo ${PASSWORD_MAX}).`)
  .regex(/[A-Za-z]/, "La contraseña debe incluir al menos una letra.")
  .regex(/[0-9]/, "La contraseña debe incluir al menos un número.");

/** Devuelve el primer problema de la contraseña, o null si está bien. Útil para validar antes de enviar. */
export function validarPassword(valor: string): string | null {
  const r = passwordSchema.safeParse(valor);
  return r.success ? null : r.error.issues[0].message;
}
