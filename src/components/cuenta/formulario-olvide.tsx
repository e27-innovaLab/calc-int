"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton, BotonLink } from "@/components/ui/boton";
import { Campo, clasesCampo } from "@/components/ui/campo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { requestPasswordReset } from "@/lib/auth-client";
import { esEmailValido } from "@/lib/password";

/**
 * «Olvidé mi contraseña»: se pide el email y se manda un enlace para elegir una nueva.
 * La respuesta es siempre la misma, exista o no la cuenta: no se revela qué emails están registrados.
 */
export function FormularioOlvide() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [errorServidor, setErrorServidor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviadoA, setEnviadoA] = useState<string | null>(null);
  const refEmail = useRef<HTMLInputElement>(null);
  const idEmail = `${useId()}-email`;

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return;
    setErrorServidor("");

    const correo = email.trim();
    if (!correo) {
      setError("Escribí tu email.");
      return refEmail.current?.focus();
    }
    if (!esEmailValido(correo)) {
      setError("Revisá el email: falta el @ o el dominio (por ejemplo, nombre@correo.com).");
      return refEmail.current?.focus();
    }
    setError("");

    setEnviando(true);
    try {
      // redirectTo: adónde lleva el enlace del mail (se le agrega ?token=...).
      const { error: errorEnvio } = await requestPasswordReset({ email: correo, redirectTo: "/restablecer" });
      // Solo se avisa si hubo demasiados intentos o una falla del servidor; el resto se muestra igual
      // exista o no la cuenta, para no revelar qué emails están registrados.
      if (errorEnvio?.status === 429) {
        setErrorServidor("Hiciste demasiados intentos seguidos. Esperá un momento y probá de nuevo.");
        return;
      }
      if (errorEnvio && (errorEnvio.status ?? 500) >= 500) {
        setErrorServidor("No pudimos enviar el enlace. Probá de nuevo en unos minutos.");
        return;
      }
      setEnviadoA(correo);
    } catch {
      setErrorServidor("No pudimos enviar el enlace. Probá de nuevo en unos minutos.");
    } finally {
      setEnviando(false);
    }
  }

  if (enviadoA) {
    return (
      <Tarjeta className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-primary-900">Revisá tu correo</h1>
        <p className="text-base text-gray-700">
          Si hay una cuenta con <strong className="break-all">{enviadoA}</strong>, te enviamos un enlace para elegir una contraseña nueva. El
          enlace vence en 1 hora.
        </p>
        <p className="text-sm text-gray-700">Si no lo ves, mirá en spam o correo no deseado.</p>
        <div className="flex flex-wrap gap-3">
          <BotonLink href="/cuenta">Volver a iniciar sesión</BotonLink>
          <Boton variante="secundario" onClick={() => setEnviadoA(null)}>
            Usar otro email
          </Boton>
        </div>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-primary-900">Restablecé tu contraseña</h1>
        <p className="text-base text-gray-700">Escribí el email de tu cuenta y te mandamos un enlace para elegir una contraseña nueva.</p>
      </div>

      <form onSubmit={enviar} noValidate className="flex flex-col gap-5" aria-busy={enviando}>
        <Campo idControl={idEmail} etiqueta="Email" error={error} idError={`${idEmail}-error`}>
          <input
            ref={refEmail}
            id={idEmail}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nombre@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${idEmail}-error` : undefined}
            className={clasesCampo(Boolean(error))}
          />
        </Campo>

        {errorServidor ? (
          <div role="alert">
            <Aviso tono="advertencia" titulo="No pudimos enviar el enlace">
              {errorServidor}
            </Aviso>
          </div>
        ) : null}

        <Boton type="submit" disabled={enviando} className="w-full">
          {enviando ? "Enviando…" : "Enviarme el enlace"}
        </Boton>
      </form>

      <p className="text-sm text-gray-700">
        <Link
          href="/cuenta"
          className="rounded font-medium underline underline-offset-2 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </Tarjeta>
  );
}
