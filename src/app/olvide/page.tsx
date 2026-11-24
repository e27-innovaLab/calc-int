"use client";

import Link from "next/link";
import { useState } from "react";

import { requestPasswordReset } from "@/lib/auth-client";
import { esEmailValido } from "@/lib/password";

/**
 * "Olvidé mi contraseña": el usuario ingresa su email y recibe un enlace para restablecerla.
 * Por seguridad, la respuesta es siempre la misma exista o no la cuenta (no se revela si el email está registrado).
 * Página provisoria sin diseño final.
 */
export default function OlvidePassword() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  const [error, setError] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!esEmailValido(email)) return setError("El email no es válido.");
    setError("");
    setEnviando(true);
    // redirectTo: adónde lleva el enlace del mail (con ?token=...).
    await requestPasswordReset({ email, redirectTo: "/restablecer" });
    setEnviando(false);
    setListo(true);
  }

  if (listo) {
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
        <h1 className="text-xl font-bold">Revisá tu email</h1>
        <p>Si hay una cuenta con ese correo, te enviamos un enlace para restablecer la contraseña. Vence en 1 hora.</p>
        <Link className="underline" href="/test_de_guardado">Volver</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">Restablecer contraseña</h1>
      <form onSubmit={enviar} className="flex flex-col gap-3">
        <input
          className="rounded border p-2"
          type="email"
          required
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="rounded bg-black px-3 py-2 text-white" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviarme el enlace"}
        </button>
      </form>
      <Link className="underline" href="/test_de_guardado">Volver</Link>
    </main>
  );
}
