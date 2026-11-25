"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton, BotonLink } from "@/components/ui/boton";
import { Campo, clasesCampo } from "@/components/ui/campo";
import { Tarjeta } from "@/components/ui/tarjeta";
import { resetPassword } from "@/lib/auth-client";
import { mensajeDeError } from "@/lib/errores-auth";
import { REQUISITOS_PASSWORD, validarPassword } from "@/lib/password";

type ErroresRestablecer = Partial<Record<"password" | "repetida", string>>;

/**
 * Pantalla a la que llega el enlace del mail: `/restablecer?token=...`.
 * La persona elige una contraseña nueva (que cumpla los requisitos) y se guarda con ese token.
 */
export function FormularioRestablecer() {
  const parametros = useSearchParams();
  const token = parametros.get("token");
  // Better Auth manda ?error=INVALID_TOKEN cuando el enlace no sirve.
  const enlaceInvalido = !token || Boolean(parametros.get("error"));

  const [password, setPassword] = useState("");
  const [repetida, setRepetida] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [errores, setErrores] = useState<ErroresRestablecer>({});
  const [errorServidor, setErrorServidor] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [listo, setListo] = useState(false);
  const refPassword = useRef<HTMLInputElement>(null);
  const refRepetida = useRef<HTMLInputElement>(null);
  const id = useId();
  const idPassword = `${id}-password`;
  const idRepetida = `${id}-repetida`;

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (guardando || !token) return;
    setErrorServidor("");

    const encontrados: ErroresRestablecer = {};
    const problema = validarPassword(password);
    if (problema) encontrados.password = problema;
    if (!repetida) encontrados.repetida = "Repetí la contraseña nueva.";
    else if (password !== repetida) encontrados.repetida = "Las contraseñas no coinciden.";
    setErrores(encontrados);
    if (encontrados.password) return refPassword.current?.focus();
    if (encontrados.repetida) return refRepetida.current?.focus();

    setGuardando(true);
    try {
      const { error } = await resetPassword({ newPassword: password, token });
      if (error) {
        setErrorServidor(mensajeDeError(error));
        return;
      }
      setListo(true);
    } catch {
      setErrorServidor("No pudimos cambiar la contraseña. Probá de nuevo en unos minutos.");
    } finally {
      setGuardando(false);
    }
  }

  if (enlaceInvalido) {
    return (
      <Tarjeta className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-primary-900">Este enlace ya no sirve</h1>
        <p className="text-base text-gray-700">El enlace no es válido o venció. Pedí uno nuevo y te lo mandamos por correo.</p>
        <div className="flex flex-wrap gap-3">
          <BotonLink href="/olvide">Pedir otro enlace</BotonLink>
          <BotonLink href="/cuenta" variante="secundario">
            Volver a iniciar sesión
          </BotonLink>
        </div>
      </Tarjeta>
    );
  }

  if (listo) {
    return (
      <Tarjeta className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold text-primary-900">Listo, cambiaste tu contraseña</h1>
        <p className="text-base text-gray-700">Ya podés iniciar sesión con la contraseña nueva.</p>
        <div>
          <BotonLink href="/cuenta">Iniciar sesión</BotonLink>
        </div>
      </Tarjeta>
    );
  }

  return (
    <Tarjeta className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-primary-900">Elegí una contraseña nueva</h1>
        <p className="text-base text-gray-700">Tiene que ser distinta de las que usás en otros sitios.</p>
      </div>

      <form onSubmit={enviar} noValidate className="flex flex-col gap-5" aria-busy={guardando}>
        <Campo
          idControl={idPassword}
          etiqueta="Contraseña nueva"
          descripcion={REQUISITOS_PASSWORD.join(" · ")}
          error={errores.password}
          idError={`${idPassword}-error`}
        >
          <input
            ref={refPassword}
            id={idPassword}
            type={verPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={Boolean(errores.password)}
            aria-describedby={errores.password ? `${idPassword}-error` : undefined}
            className={clasesCampo(Boolean(errores.password))}
          />
        </Campo>

        <Campo idControl={idRepetida} etiqueta="Repetí la contraseña" error={errores.repetida} idError={`${idRepetida}-error`}>
          <input
            ref={refRepetida}
            id={idRepetida}
            type={verPassword ? "text" : "password"}
            autoComplete="new-password"
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
            aria-invalid={Boolean(errores.repetida)}
            aria-describedby={errores.repetida ? `${idRepetida}-error` : undefined}
            className={clasesCampo(Boolean(errores.repetida))}
          />
          <label className="mt-1 flex w-fit items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={verPassword}
              onChange={(e) => setVerPassword(e.target.checked)}
              className="size-4 accent-primary-700"
            />
            Mostrar contraseñas
          </label>
        </Campo>

        {errorServidor ? (
          <div role="alert">
            <Aviso tono="advertencia" titulo="No pudimos cambiar la contraseña">
              {errorServidor}
            </Aviso>
          </div>
        ) : null}

        <Boton type="submit" disabled={guardando} className="w-full">
          {guardando ? "Guardando…" : "Cambiar contraseña"}
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
