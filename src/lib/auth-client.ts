"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Cliente de Better Auth para el navegador. La URL base es la del propio sitio; en el servidor (al
 * prerenderizar) se usa un valor de reemplazo para que no falle la compilación.
 */
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  requestPasswordReset, // pide el mail de reseteo: requestPasswordReset({ email, redirectTo })
  resetPassword, // guarda la nueva contraseña: resetPassword({ newPassword, token })
  sendVerificationEmail, // reenvía el mail de confirmación: sendVerificationEmail({ email, callbackURL })
} = authClient;
