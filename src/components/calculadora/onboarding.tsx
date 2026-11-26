"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";

import {
  CLAVE_ONBOARDING,
  PASOS_ONBOARDING,
  conPasoCerrado,
  leerCerrados,
  pasoOnboardingPorRuta,
  sinPasoCerrado,
  type PasoOnboarding,
} from "./onboarding-contenido";

// --- Estado guardado: qué pasos cerró la persona. Es independiente del borrador del cálculo (Reiniciar no lo toca). ---

const oyentes = new Set<() => void>();

function suscribir(alCambiar: () => void): () => void {
  oyentes.add(alCambiar);
  window.addEventListener("storage", alCambiar);
  return () => {
    oyentes.delete(alCambiar);
    window.removeEventListener("storage", alCambiar);
  };
}

/** localStorage puede faltar o fallar (modo privado, cuota, políticas del navegador): nunca debe romper la pantalla. */
function leerCrudo(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_ONBOARDING);
  } catch {
    return null;
  }
}

// Si no se puede guardar, igual se respeta el cierre mientras dure la visita.
let respaldoEnMemoria: string | null = null;
let guardadoDisponible = true;

function leerSnapshot(): string | null {
  const crudo = leerCrudo();
  if (crudo !== null) {
    guardadoDisponible = true;
    return crudo;
  }
  return guardadoDisponible ? null : respaldoEnMemoria;
}

function escribir(cerrados: number[]) {
  const crudo = JSON.stringify(cerrados);
  try {
    window.localStorage.setItem(CLAVE_ONBOARDING, crudo);
    guardadoDisponible = true;
  } catch {
    guardadoDisponible = false;
    respaldoEnMemoria = crudo;
  }
  oyentes.forEach((o) => o());
}

function useCerrados() {
  const crudo = useSyncExternalStore(suscribir, leerSnapshot, () => null);
  const cerrados = useMemo(() => leerCerrados(crudo), [crudo]);
  return {
    cerrados,
    cerrar: (paso: number) => escribir(conPasoCerrado(cerrados, paso)),
    abrir: (paso: number) => escribir(sinPasoCerrado(cerrados, paso)),
  };
}

// --- Piezas visuales ---

/** Avatar de la guía (Figma): círculo marino con una carita. Decorativo. */
function Avatar() {
  return (
    <svg aria-hidden="true" viewBox="0 0 40 40" className="size-10 shrink-0">
      <circle cx="20" cy="20" r="20" fill="#101b3b" />
      <circle cx="20" cy="20" r="11" fill="#f59e0b" />
      <circle cx="16.5" cy="17.5" r="1.4" fill="#101b3b" />
      <circle cx="23.5" cy="17.5" r="1.4" fill="#101b3b" />
      <path d="M15.5 22c1 2.4 3 3.4 4.5 3.4s3.5-1 4.5-3.4" fill="none" stroke="#101b3b" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Chips con la definición de una palabra: se abre con el cursor, el foco o un toque, y se cierra con Escape. */
function Terminos({ terminos }: { terminos: PasoOnboarding["terminos"] }) {
  const [activo, setActivo] = useState<number | null>(null);
  const id = useId();

  return (
    <div className="relative" onMouseLeave={() => setActivo(null)}>
      <ul className="flex flex-wrap gap-2">
        {terminos.map((t, i) => (
          <li key={t.termino}>
            <button
              type="button"
              aria-describedby={activo === i ? `${id}-tip` : undefined}
              aria-expanded={activo === i}
              onMouseEnter={() => setActivo(i)}
              onFocus={() => setActivo(i)}
              onBlur={() => setActivo((a) => (a === i ? null : a))}
              onClick={() => setActivo((a) => (a === i ? null : i))}
              onKeyDown={(e) => {
                if (e.key === "Escape" && activo !== null) {
                  // Cierra solo la definición, no la tarjeta.
                  e.stopPropagation();
                  setActivo(null);
                }
              }}
              className="inline-flex min-h-10 items-center rounded-full bg-primary-100 px-3.5 py-1.5 text-sm font-medium text-primary-900 transition-colors hover:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
            >
              {t.termino}
            </button>
          </li>
        ))}
      </ul>
      {activo !== null ? (
        <p
          id={`${id}-tip`}
          role="tooltip"
          className="absolute inset-x-0 bottom-full z-10 mb-2 rounded-xl bg-gray-900 p-3 text-left text-sm leading-snug text-white shadow-lg"
        >
          <span className="font-semibold">{terminos[activo].termino}: </span>
          {terminos[activo].definicion}
        </p>
      ) : null}
    </div>
  );
}

function Tarjeta({
  paso,
  indice,
  alCerrar,
  tituloRef,
}: {
  paso: PasoOnboarding;
  indice: number;
  alCerrar: () => void;
  tituloRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <section
      aria-label={`Ayuda del paso ${indice + 1}`}
      className="rounded-2xl border border-primary-900 bg-white p-4 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <Avatar />
        <p className="min-w-0 flex-1 pt-0.5 text-xs font-bold uppercase leading-tight tracking-widest">
          <span className="block text-primary-600">
            Paso {indice + 1} de {PASOS_ONBOARDING.length}
          </span>
          <span className="block text-primary-900">{paso.etiqueta}</span>
        </p>
        <button
          type="button"
          onClick={alCerrar}
          aria-label="Cerrar ayuda"
          className="-m-1 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-xl leading-none text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-700"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <h3 ref={tituloRef} tabIndex={-1} className="mt-3 text-sm font-bold leading-snug text-primary-900 focus:outline-none">
        {paso.titulo}
      </h3>
      <p className="mt-2 text-sm leading-snug text-gray-800">
        {paso.cuerpo.map((t, i) =>
          t.negrita ? (
            <strong key={i} className="font-semibold">
              {t.texto}
            </strong>
          ) : (
            <span key={i}>{t.texto}</span>
          ),
        )}
      </p>
      {paso.invitacion ? <p className="mt-2 text-xs italic text-gray-700">{paso.invitacion}</p> : null}
      {paso.datoUtil ? (
        <p className="mt-2 text-xs leading-snug text-gray-700">
          <strong className="font-semibold">Dato útil:</strong> {paso.datoUtil}
        </p>
      ) : null}
      <div className="mt-3">
        <Terminos terminos={paso.terminos} />
      </div>
    </section>
  );
}

/**
 * Onboarding del recorrido (Figma «Onboarding»): una tarjeta por paso en la columna del resumen, alineada abajo.
 * Al cerrarla queda el botón «¿Necesitás ayuda?» en el mismo lugar, así nunca queda tapado ni hay que buscarlo.
 */
export function Onboarding() {
  const ruta = usePathname();
  const indice = pasoOnboardingPorRuta(ruta);
  const { cerrados, cerrar, abrir } = useCerrados();

  const tituloRef = useRef<HTMLHeadingElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  // Solo se mueve el foco cuando la persona abre o cierra la ayuda, no al llegar a un paso.
  const moverFoco = useRef<"tarjeta" | "boton" | null>(null);

  const abierta = indice !== null && !cerrados.includes(indice);

  useEffect(() => {
    if (moverFoco.current === "tarjeta" && abierta) tituloRef.current?.focus();
    if (moverFoco.current === "boton" && !abierta) botonRef.current?.focus();
    moverFoco.current = null;
  }, [abierta]);

  if (indice === null) return null;

  return (
    <div>
      {abierta ? (
        <Tarjeta
          paso={PASOS_ONBOARDING[indice]}
          indice={indice}
          tituloRef={tituloRef}
          alCerrar={() => {
            moverFoco.current = "boton";
            cerrar(indice);
          }}
        />
      ) : (
        <div className="flex justify-end">
          <button
            ref={botonRef}
            type="button"
            onClick={() => {
              moverFoco.current = "tarjeta";
              abrir(indice);
            }}
            className="inline-flex min-h-11 items-center rounded-full border border-primary-900 bg-white px-4 py-2 text-sm font-semibold text-primary-900 shadow-sm transition-colors hover:bg-primary-100 active:bg-accent-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
          >
            ¿Necesitás ayuda?
          </button>
        </div>
      )}
    </div>
  );
}
