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

/** Validación simple de formato de email (algo@algo.algo). No verifica que exista. */
export function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Fuerza de la contraseña, para mostrar un indicador mientras se escribe. */
export function fuerzaPassword(valor: string): { nivel: 0 | 1 | 2 | 3; etiqueta: string } {
  if (!valor) return { nivel: 0, etiqueta: "" };
  let puntos = 0;
  if (valor.length >= 8) puntos++;
  if (valor.length >= 12) puntos++;
  if (/[A-Za-z]/.test(valor) && /[0-9]/.test(valor)) puntos++;
  if (/[^A-Za-z0-9]/.test(valor)) puntos++;
  const nivel = puntos <= 1 ? 1 : puntos <= 3 ? 2 : 3;
  return { nivel, etiqueta: nivel === 1 ? "Débil" : nivel === 2 ? "Media" : "Fuerte" };
}
