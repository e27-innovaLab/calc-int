"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

import { RUTAS_PRODUCCION, type RutaProduccion } from "@/domain/types";

interface OpcionRuta {
  titulo: string;
  descripcion: string;
  icono: ReactNode;
}

const trazo = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Textos del diseño (Figma, «¿Cómo producís?»). */
export const OPCIONES_RUTA: Record<RutaProduccion, OpcionRuta> = {
  lotes: {
    titulo: "Por lotes/tandas",
    descripcion: "Producís en cantidad durante un mismo proceso u horneada. Por ejemplo: pastelería, velas o cerámica.",
    icono: (
      <svg {...trazo}>
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5M9 13h6M9 17h6" />
      </svg>
    ),
  },
  unidad: {
    titulo: "Por unidad a medida",
    descripcion: "Diseñás, armás o construís cada producto de forma individual y exclusiva.",
    icono: (
      <svg {...trazo}>
        <path d="m3 17 6-6 4 4 8-8" />
        <path d="M15 7h6v6" />
      </svg>
    ),
  },
  reventa: {
    titulo: "Compro y revendo",
    descripcion: "Comprás productos ya terminados para comercializarlos, sin fabricarlos.",
    icono: (
      <svg {...trazo}>
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" />
        <circle cx="7.5" cy="7.5" r="1" />
      </svg>
    ),
  },
};

interface Props {
  valor: RutaProduccion;
  onChange: (ruta: RutaProduccion) => void;
}

/**
 * Selector de la ruta de producción (paso 1). Es un grupo de opciones únicas:
 * Tab entra al grupo, las flechas cambian la opción y la elegida se marca con ✓ (no solo con color).
 */
export function SelectorRuta({ valor, onChange }: Props) {
  const botones = useRef<Record<RutaProduccion, HTMLButtonElement | null>>({ lotes: null, unidad: null, reventa: null });

  function alTeclear(evento: KeyboardEvent<HTMLButtonElement>) {
    const avance = evento.key === "ArrowRight" || evento.key === "ArrowDown" ? 1 : evento.key === "ArrowLeft" || evento.key === "ArrowUp" ? -1 : 0;
    if (avance === 0) return;
    evento.preventDefault();
    const posicion = RUTAS_PRODUCCION.indexOf(valor);
    const siguiente = RUTAS_PRODUCCION[(posicion + avance + RUTAS_PRODUCCION.length) % RUTAS_PRODUCCION.length];
    onChange(siguiente);
    botones.current[siguiente]?.focus();
  }

  return (
    <div role="radiogroup" aria-labelledby="ruta-titulo" className="grid gap-3 md:grid-cols-3">
      {RUTAS_PRODUCCION.map((ruta) => {
        const opcion = OPCIONES_RUTA[ruta];
        const elegida = ruta === valor;
        return (
          <button
            key={ruta}
            ref={(el) => {
              botones.current[ruta] = el;
            }}
            type="button"
            role="radio"
            aria-checked={elegida}
            tabIndex={elegida ? 0 : -1}
            onClick={() => onChange(ruta)}
            onKeyDown={alTeclear}
            className={`relative flex min-h-11 flex-col items-start gap-2 rounded-xl border-2 p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${
              elegida
                ? "border-primary-600 bg-primary-100 text-gray-900"
                : "border-gray-200 bg-white text-gray-900 hover:border-gray-400"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex size-9 items-center justify-center rounded-lg ${
                elegida ? "bg-primary-900 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {opcion.icono}
            </span>
            <span className="text-base font-bold">{opcion.titulo}</span>
            <span className="text-sm text-gray-700">{opcion.descripcion}</span>
            {elegida ? (
              <span
                aria-hidden="true"
                className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary-900 text-sm font-bold text-white"
              >
                ✓
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
