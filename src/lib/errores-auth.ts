/**
 * Traduce los errores de Better Auth a mensajes claros en español. Evita mostrar "undefined",
 * textos en inglés o códigos técnicos. Reusable por cualquier pantalla de login.
 */
interface ErrorAuth {
  code?: string;
  message?: string;
  status?: number;
}

const POR_CODIGO: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email o contraseña incorrectos.",
  INVALID_PASSWORD: "La contraseña es incorrecta.",
  USER_ALREADY_EXISTS: "Ya existe una cuenta con ese email.",
  USER_NOT_FOUND: "No encontramos una cuenta con ese email.",
  EMAIL_NOT_VERIFIED: "Tenés que confirmar tu email antes de entrar. Revisá tu correo.",
  INVALID_EMAIL: "El email no es válido.",
  PASSWORD_TOO_SHORT: "La contraseña es demasiado corta.",
  PASSWORD_TOO_LONG: "La contraseña es demasiado larga.",
  INVALID_TOKEN: "El enlace no es válido o ya venció. Pedí uno nuevo.",
  TOKEN_EXPIRED: "El enlace venció. Pedí uno nuevo.",
};

/** Extrae los segundos a esperar de un mensaje de rate limit, si los trae. */
function segundosDeEspera(mensaje: string): number | null {
  const m = mensaje.match(/(\d+)\s*(second|segundo|sec)/i) ?? mensaje.match(/\b(\d{1,4})\b/);
  return m ? Number(m[1]) : null;
}

export function mensajeDeError(error: ErrorAuth | null | undefined): string {
  if (!error) return "Ocurrió un error. Probá de nuevo.";

  const msg = (error.message ?? "").trim();

  // Demasiados intentos (rate limit): mensaje en español, con el tiempo de espera si se conoce.
  if (error.status === 429 || /too many|rate limit/i.test(msg)) {
    const seg = segundosDeEspera(msg);
    return seg
      ? `Demasiados intentos. Esperá ${seg} segundos y volvé a probar.`
      : "Demasiados intentos. Esperá un momento y volvé a probar.";
  }

  if (error.code && POR_CODIGO[error.code]) return POR_CODIGO[error.code];

  // Mapeo por texto, para versiones que no mandan `code`.
  if (/verif/i.test(msg)) return POR_CODIGO.EMAIL_NOT_VERIFIED;
  if (/invalid email or password|credential/i.test(msg)) return POR_CODIGO.INVALID_EMAIL_OR_PASSWORD;
  if (/already exists|exist/i.test(msg)) return POR_CODIGO.USER_ALREADY_EXISTS;
  if (/not found/i.test(msg)) return POR_CODIGO.USER_NOT_FOUND;
  if (/invalid.*token|token.*invalid|expired/i.test(msg)) return POR_CODIGO.INVALID_TOKEN;
  if (/network|fetch|failed to fetch/i.test(msg)) return "No hay conexión. Revisá tu internet y probá de nuevo.";

  // Último recurso: nunca mostrar "undefined" ni un texto vacío.
  return msg && msg.toLowerCase() !== "undefined" ? msg : "No se pudo completar la acción. Probá de nuevo.";
}
