import "server-only";

/**
 * Envío de emails por Gmail (SMTP), gratis y sin dominio propio. Usa una "contraseña de aplicación"
 * de una cuenta de Gmail (ver docs/login-y-mail.md para generarla).
 *
 * - Si están definidas `GMAIL_USER` y `GMAIL_APP_PASSWORD`, manda el mail de verdad.
 * - Si NO lo están (desarrollo sin configurar), NO falla: imprime el contenido en la consola del
 *   servidor, así podés copiar el link de verificación o de reseteo desde la terminal y probar igual.
 *
 * Requiere el paquete `nodemailer` (se importa solo cuando hace falta enviar):
 *     npm install nodemailer
 *     npm install -D @types/nodemailer
 *
 * Variables:
 *   GMAIL_USER           la dirección de Gmail del proyecto (ej. precijusto@gmail.com).
 *   GMAIL_APP_PASSWORD   la contraseña de aplicación de 16 caracteres (NO la contraseña normal).
 *   MAIL_FROM_NOMBRE     opcional, nombre que se muestra como remitente (por defecto "PreciJusto").
 */
interface Mail {
  to: string;
  subject: string;
  html: string;
}

/** `true` si el envío real está configurado. Lo usa auth.ts para decidir si exige verificación en desarrollo. */
export function mailConfigurado(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

export async function enviarMail({ to, subject, html }: Mail): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const nombre = process.env.MAIL_FROM_NOMBRE ?? "PreciJusto";

  if (!user || !pass) {
    // Fallback de desarrollo: no se manda nada, se registra para poder seguir el link a mano.
    console.log(`\n[mail:simulado] para=${to}\n  asunto: ${subject}\n  ${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}\n`);
    return;
  }

  // Import dinámico: así, si todavía no instalaste nodemailer o no configuraste el envío, el build no se rompe.
  const nodemailer = (await import("nodemailer")).default;
  const transporte = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  // Gmail obliga a que el remitente sea la cuenta autenticada; solo se personaliza el nombre visible.
  await transporte.sendMail({ from: `${nombre} <${user}>`, to, subject, html });
}

/** Plantilla simple con un botón; `textoBoton` y `url` arman la acción. */
export function plantillaMail(titulo: string, cuerpo: string, textoBoton: string, url: string): string {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;color:#1f2937">
    <h2 style="color:#111827">${titulo}</h2>
    <p>${cuerpo}</p>
    <p style="margin:24px 0">
      <a href="${url}" style="background:#4f46e5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">${textoBoton}</a>
    </p>
    <p style="font-size:13px;color:#6b7280">Si el botón no funciona, copiá y pegá este enlace:<br>${url}</p>
    <p style="font-size:13px;color:#6b7280">Si no fuiste vos, ignorá este mensaje.</p>
  </div>`;
}
