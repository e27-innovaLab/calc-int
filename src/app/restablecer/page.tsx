"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { resetPassword } from "@/lib/auth-client";
import { REQUISITOS_PASSWORD, validarPassword } from "@/lib/password";

/**
 * Página a la que llega el enlace del mail de reseteo: `/restablecer?token=...`.
 * El usuario elige una contraseña nueva (que debe cumplir los requisitos) y se guarda con ese token.
 * Página provisoria sin diseño final.
 */
function Formulario() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const errorToken = params.get("error"); // Better Auth manda ?error=INVALID_TOKEN si el enlace no sirve.

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (!token || errorToken) {
    return (
      <div className="flex flex-col gap-3">
        <p>El enlace no es válido o venció. Pedí uno nuevo.</p>
        <Link className="underline" href="/olvide">Pedir otro enlace</Link>
      </div>
    );
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const problema = validarPassword(password);
    if (problema) return setError(problema);
    if (password !== password2) return setError("Las contraseñas no coinciden.");

    setGuardando(true);
    const { error: err } = await resetPassword({ newPassword: password, token: token! });
    setGuardando(false);
    if (err) return setError(err.message ?? "No se pudo cambiar la contraseña.");
    router.replace("/test_de_guardado");
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3">
      <input
        className="rounded border p-2"
        type="password"
        placeholder="Nueva contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        className="rounded border p-2"
        type="password"
        placeholder="Repetir contraseña"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
      />
      <ul className="list-disc pl-5 text-sm text-gray-600">
        {REQUISITOS_PASSWORD.map((r) => <li key={r}>{r}</li>)}
      </ul>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button className="rounded bg-black px-3 py-2 text-white" disabled={guardando}>
        {guardando ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}

export default function Restablecer() {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">Elegí una nueva contraseña</h1>
      <Suspense fallback={<p>Cargando…</p>}>
        <Formulario />
      </Suspense>
    </main>
  );
}
