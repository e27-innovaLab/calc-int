"use client";

import Link from "next/link";
import { useState } from "react";

import { enlaceCompartido, guardarCalculo, rutaCompartida, type ResultadoGuardado } from "@/lib/api-calculos";
import { sendVerificationEmail, signIn, signOut, signUp, useSession } from "@/lib/auth-client";
import { REQUISITOS_PASSWORD, validarPassword } from "@/lib/password";
import { useCalculoStore } from "@/store/calculo-store";

/**
 * PÁGINA DE PRUEBA del backend (sin diseño). Sirve para comprobar el recorrido completo sin esperar al frontend:
 * crear cuenta → iniciar sesión → guardar el cálculo actual → abrir el link.
 * Borrar esta carpeta cuando la interfaz real de «Guardar y compartir» esté lista.
 */
export default function PruebaDeGuardado() {
  const { data: sesion, isPending } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [resultado, setResultado] = useState<ResultadoGuardado | null>(null);

  async function registrar() {
    const problema = validarPassword(password);
    if (problema) return setMensaje(problema);
    const { error } = await signUp.email({ email, password, name: email.split("@")[0] });
    setMensaje(
      error
        ? `Error: ${error.message}`
        : "Cuenta creada. Te enviamos un email para confirmar tu dirección (en desarrollo sin Gmail configurado, el enlace aparece en la consola del servidor). Confirmá y después iniciá sesión.",
    );
  }

  async function entrar() {
    const { error } = await signIn.email({ email, password });
    if (!error) return setMensaje("Sesión iniciada.");
    const sinVerificar = /verif/i.test(error.message ?? "") || (error as { status?: number }).status === 403;
    setMensaje(sinVerificar ? "Tenés que confirmar tu email antes de entrar. Revisá tu correo." : `Error: ${error.message}`);
  }

  async function reenviarConfirmacion() {
    if (!email) return setMensaje("Escribí tu email arriba primero.");
    await sendVerificationEmail({ email, callbackURL: "/test_de_guardado" });
    setMensaje("Te reenviamos el email de confirmación.");
  }

  async function guardar() {
    // El store no lee localStorage solo (skipHydration): se lee ahora, para guardar el borrador real del navegador.
    await useCalculoStore.persist.rehydrate();
    setResultado(await guardarCalculo(useCalculoStore.getState().calculo));
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">Prueba de guardado (backend)</h1>

      <Link className="underline" href="/test_de_usuario">Ver mis cálculos guardados →</Link>

      {isPending ? <p>Cargando sesión…</p> : sesion ? <p>Sesión: {sesion.user.email}</p> : <p>Sin sesión.</p>}

      <input className="rounded border p-2" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        className="rounded border p-2"
        type="password"
        placeholder="contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <p className="text-xs text-gray-600">Requisitos: {REQUISITOS_PASSWORD.join(" · ")}</p>
      <div className="flex gap-2">
        <button className="rounded border px-3 py-1" onClick={registrar}>Crear cuenta</button>
        <button className="rounded border px-3 py-1" onClick={entrar}>Entrar</button>
        <button className="rounded border px-3 py-1" onClick={() => signOut()}>Salir</button>
      </div>
      <div className="flex gap-4 text-sm">
        <Link className="underline" href="/olvide">¿Olvidaste tu contraseña?</Link>
        <button className="underline" onClick={reenviarConfirmacion}>Reenviar confirmación</button>
      </div>
      {mensaje ? <p>{mensaje}</p> : null}

      <button className="rounded bg-black px-3 py-2 text-white" onClick={guardar}>
        Guardar el cálculo actual
      </button>
      {resultado?.ok ? (
        <p>
          {resultado.creado ? "Guardado." : "Actualizado."} Link:{" "}
          <Link className="underline" href={rutaCompartida(resultado.id)}>{enlaceCompartido(resultado.id)}</Link>
        </p>
      ) : resultado ? (
        <p>No se guardó ({resultado.motivo}): {resultado.mensaje}</p>
      ) : null}
    </main>
  );
}
