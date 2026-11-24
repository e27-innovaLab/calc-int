"use client";

import Link from "next/link";
import { useState } from "react";

import { enlaceCompartido, guardarCalculo, rutaCompartida, type ResultadoGuardado } from "@/lib/api-calculos";
import { sendVerificationEmail, signIn, signOut, signUp, useSession } from "@/lib/auth-client";
import { mensajeDeError } from "@/lib/errores-auth";
import { esEmailValido, fuerzaPassword, REQUISITOS_PASSWORD, validarPassword } from "@/lib/password";
import { useCalculoStore } from "@/store/calculo-store";

/**
 * PÁGINA DE PRUEBA del backend (sin diseño final). Sirve para comprobar el recorrido completo:
 * crear cuenta → confirmar email → iniciar sesión → guardar el cálculo → abrir el link.
 * Borrar esta carpeta cuando la interfaz real de «Guardar y compartir» esté lista.
 */
export default function PruebaDeGuardado() {
  const { data: sesion, isPending } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [bloqMayus, setBloqMayus] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; tono: "error" | "ok" } | null>(null);
  const [resultado, setResultado] = useState<ResultadoGuardado | null>(null);
  const [modalReenvio, setModalReenvio] = useState(false);

  const mostrarError = (texto: string) => setAviso({ texto, tono: "error" });
  const mostrarOk = (texto: string) => setAviso({ texto, tono: "ok" });
  const fuerza = fuerzaPassword(password);

  async function registrar() {
    if (!esEmailValido(email)) return mostrarError("El email no es válido.");
    const problema = validarPassword(password);
    if (problema) return mostrarError(problema);
    setCargando(true);
    const { error } = await signUp.email({ email: email.trim(), password, name: email.split("@")[0] });
    setCargando(false);
    if (error) return mostrarError(mensajeDeError(error));
    mostrarOk("Cuenta creada. Te enviamos un email para confirmar tu dirección: revisá tu correo (y la carpeta de spam). Confirmá y después iniciá sesión.");
  }

  async function entrar() {
    if (!esEmailValido(email)) return mostrarError("El email no es válido.");
    setCargando(true);
    const { error } = await signIn.email({ email: email.trim(), password });
    setCargando(false);
    if (error) return mostrarError(mensajeDeError(error));
    mostrarOk("Sesión iniciada.");
  }

  async function guardar() {
    await useCalculoStore.persist.rehydrate();
    setResultado(await guardarCalculo(useCalculoStore.getState().calculo));
  }

  // Enter no inicia sesión ni crea cuenta; además detecta Bloq Mayús para avisar.
  const teclaPassword = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
    if (typeof e.getModifierState === "function") setBloqMayus(e.getModifierState("CapsLock"));
  };

  const colorFuerza = ["bg-gray-200", "bg-red-500", "bg-yellow-500", "bg-green-600"][fuerza.nivel];

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-xl font-bold">Prueba de guardado (backend)</h1>

      <Link className="underline" href="/test_de_usuario">Ver mis cálculos guardados →</Link>

      {isPending ? <p>Cargando sesión…</p> : sesion ? <p>Sesión: {sesion.user.email}</p> : <p>Sin sesión.</p>}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input
          id="email"
          className="rounded border p-2"
          type="email"
          autoComplete="email"
          autoFocus
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
        <div className="relative">
          <input
            id="password"
            className="w-full rounded border p-2 pr-10"
            type={verPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={teclaPassword}
            onKeyUp={teclaPassword}
            aria-describedby="requisitos"
          />
          <button
            type="button"
            onClick={() => setVerPassword((v) => !v)}
            aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-lg"
          >
            {verPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Indicador de fuerza */}
        {password ? (
          <div className="flex items-center gap-2" aria-live="polite">
            <div className="h-1.5 flex-1 overflow-hidden rounded bg-gray-200">
              <div className={`h-full ${colorFuerza}`} style={{ width: `${(fuerza.nivel / 3) * 100}%` }} />
            </div>
            <span className="text-xs text-gray-600">{fuerza.etiqueta}</span>
          </div>
        ) : null}

        {bloqMayus ? <p className="text-xs text-yellow-700">⚠️ Tenés activado Bloq Mayús.</p> : null}
        <p id="requisitos" className="text-xs text-gray-600">Requisitos: {REQUISITOS_PASSWORD.join(" · ")}</p>
      </div>

      <div className="flex gap-2">
        <button className="rounded border px-3 py-1 disabled:opacity-50" onClick={registrar} disabled={cargando}>
          Crear cuenta
        </button>
        <button className="rounded border px-3 py-1 disabled:opacity-50" onClick={entrar} disabled={cargando}>
          Entrar
        </button>
        <button className="rounded border px-3 py-1" onClick={() => signOut()}>Salir</button>
      </div>

      <div className="flex gap-4 text-sm">
        <Link className="underline" href="/olvide">¿Olvidaste tu contraseña?</Link>
        <button className="underline" onClick={() => setModalReenvio(true)}>Reenviar confirmación</button>
      </div>

      {aviso ? (
        <p className={aviso.tono === "error" ? "text-sm text-red-700" : "text-sm text-gray-700"}>{aviso.texto}</p>
      ) : null}

      <button className="rounded bg-black px-3 py-2 text-white" onClick={guardar}>
        Guardar el cálculo actual
      </button>
      {resultado?.ok ? (
        <p>
          {resultado.creado ? "Guardado." : "Actualizado."} Link:{" "}
          <Link className="underline" href={rutaCompartida(resultado.id)}>{enlaceCompartido(resultado.id)}</Link>
        </p>
      ) : resultado ? (
        <p className="text-red-700">No se guardó: {resultado.mensaje}</p>
      ) : null}

      {modalReenvio ? <ModalReenvio emailInicial={email} onCerrar={() => setModalReenvio(false)} /> : null}
    </main>
  );
}

/** Ventana aparte: pide el email y reenvía el mail de confirmación. */
function ModalReenvio({ emailInicial, onCerrar }: { emailInicial: string; onCerrar: () => void }) {
  const [email, setEmail] = useState(emailInicial);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; tono: "error" | "ok" } | null>(null);

  async function enviar() {
    if (!esEmailValido(email)) return setAviso({ texto: "El email no es válido.", tono: "error" });
    setEnviando(true);
    const { error } = await sendVerificationEmail({ email: email.trim(), callbackURL: "/test_de_guardado" });
    setEnviando(false);
    setAviso(error ? { texto: mensajeDeError(error), tono: "error" } : { texto: "Te reenviamos el email de confirmación. Revisá tu correo.", tono: "ok" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCerrar}>
      <div className="flex w-full max-w-sm flex-col gap-3 rounded-lg bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Reenviar confirmación</h2>
        <p className="text-sm text-gray-600">Ingresá tu email y te reenviamos el enlace para confirmar la cuenta.</p>
        <label htmlFor="email-reenvio" className="sr-only">Email</label>
        <input
          id="email-reenvio"
          className="rounded border p-2"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        {aviso ? <p className={aviso.tono === "error" ? "text-sm text-red-700" : "text-sm text-green-700"}>{aviso.texto}</p> : null}
        <div className="flex justify-end gap-2">
          <button className="rounded border px-3 py-1" onClick={onCerrar}>Cerrar</button>
          <button className="rounded bg-black px-3 py-1 text-white disabled:opacity-50" onClick={enviar} disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
