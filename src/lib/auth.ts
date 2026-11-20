import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { getDb } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import { enviarMail, mailConfigurado, plantillaMail } from "@/lib/mail";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/password";

/**
 * Cuentas y sesiones (Better Auth). Variables de entorno:
 *  - BETTER_AUTH_SECRET: obligatoria (mínimo 32 caracteres aleatorios).
 *  - BETTER_AUTH_URL: URL base de la app (http://localhost:3000 en desarrollo).
 *  - GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET: opcionales; si faltan, no se habilita el login con Google.
 *  - GMAIL_USER / GMAIL_APP_PASSWORD: para enviar los mails de verificación y de reseteo (ver src/lib/mail.ts).
 *
 * Se crea la primera vez que se usa (ver `getAuth`), no al importar, para no exigir variables durante `next build`.
 */
function crearAuth() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

  // Verificación de email obligatoria en producción (y en desarrollo si ya configuraste el envío de mails).
  // En desarrollo sin Gmail configurado no se exige, para poder probar rápido; el mail igual se "envía" a la consola.
  const exigirVerificacion = process.env.NODE_ENV === "production" || mailConfigurado();

  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN,
      maxPasswordLength: PASSWORD_MAX,
      requireEmailVerification: exigirVerificacion,
      // Cierra todas las sesiones al cambiar la contraseña (por si la cuenta estaba comprometida).
      revokeSessionsOnPasswordReset: true,
      // Email de "restablecer contraseña". `url` ya lleva el token; al abrirlo, el usuario llega a /restablecer.
      sendResetPassword: async ({ user: u, url }) => {
        await enviarMail({
          to: u.email,
          subject: "Restablecé tu contraseña — PreciJusto",
          html: plantillaMail(
            "Restablecer contraseña",
            "Pediste restablecer tu contraseña. El enlace vence en 1 hora.",
            "Elegir una nueva contraseña",
            url,
          ),
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user: u, url }) => {
        await enviarMail({
          to: u.email,
          subject: "Confirmá tu email — PreciJusto",
          html: plantillaMail(
            "Confirmá tu email",
            `Hola${u.name ? ` ${u.name}` : ""}, confirmá tu dirección para activar tu cuenta.`,
            "Confirmar email",
            url,
          ),
        });
      },
    },
    socialProviders:
      googleClientId && googleClientSecret
        ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
        : {},
    // Tiene que ser el ÚLTIMO plugin de la lista: escribe las cookies de sesión desde Server Actions.
    plugins: [nextCookies()],
  });
}

let instancia: ReturnType<typeof crearAuth> | undefined;

export function getAuth() {
  instancia ??= crearAuth();
  return instancia;
}
