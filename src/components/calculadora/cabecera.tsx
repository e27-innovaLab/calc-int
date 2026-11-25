import Link from "next/link";
import type { ReactNode } from "react";

interface PropsCabecera {
  /** Centro de la cabecera: la barra de pasos. */
  centro?: ReactNode;
  /** Derecha de la cabecera: nombre del producto y «Reiniciar». */
  derecha?: ReactNode;
}

/** Logotipo «Preciar»: «Preci» en marino y «ar» en celeste, como en Figma. */
export function Logo() {
  return (
    <span className="text-xl font-extrabold tracking-tight text-primary-900">
      Preci<span className="text-accent-400">ar</span>
    </span>
  );
}

/** Marca + barra superior. Es la misma en la portada y en el recorrido. */
export function Cabecera({ centro, derecha }: PropsCabecera) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-x-3 gap-y-3 px-4 py-3 sm:px-6 md:flex-wrap md:gap-x-6 lg:flex-nowrap">
        <Link href="/" aria-label="Preciar, ir al inicio" className="shrink-0 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700">
          <Logo />
        </Link>
        {/*
          Celular (Figma mobile): todo en una fila; el progreso compacto ocupa el espacio entre el logo y los botones.
          Tablet: los pasos bajan a su propia fila. Escritorio: los pasos van al centro y todo entra en una fila
          (si el nombre del producto es largo, se corta con «…» en lugar de partir la cabecera en dos).
        */}
        {centro ? (
          <div className="min-w-0 flex-1 md:order-last md:w-full md:flex-none lg:order-none lg:w-auto">{centro}</div>
        ) : null}
        <div className="flex min-w-0 items-center justify-end gap-2 text-sm text-gray-500">{derecha}</div>
      </div>
    </header>
  );
}

const LEMA = "Una forma clara de ponerle precio a lo que hacés.";
const AVISO_LEGAL = "Preciar es una ayuda para decidir y no reemplaza el asesoramiento de un contador.";
const CREDITOS = "©2026 Preciar · Team27 · Un proyecto de InnovaLab";

/** Pie del recorrido de pasos (Figma, «Footer»): marca y lema · aviso legal · créditos. */
export function Pie() {
  return (
    <footer className="mt-auto bg-gray-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div>
          <Logo />
          <p className="mt-1 text-sm text-gray-700 lg:whitespace-nowrap">{LEMA}</p>
        </div>
        <p className="text-xs text-gray-700">{AVISO_LEGAL}</p>
        <p className="text-sm text-gray-900 lg:whitespace-nowrap">{CREDITOS}</p>
      </div>
    </footer>
  );
}

export interface EnlacePie {
  href: string;
  texto: string;
}

/** Pie de la portada (Figma, «Landing Home»): marca, aviso y créditos a la izquierda; enlaces a la derecha. */
export function PieHome({ enlaces }: { enlaces: EnlacePie[] }) {
  return (
    <footer className="mt-auto bg-gray-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:justify-between">
        <div className="flex flex-col gap-6">
          <div>
            <Logo />
            <p className="mt-1 text-sm text-gray-700">{LEMA}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-gray-700">{AVISO_LEGAL}</p>
            <p className="text-sm text-gray-900">{CREDITOS}</p>
          </div>
        </div>
        <nav aria-label="Enlaces del pie">
          <ul className="flex flex-col gap-2 text-sm font-medium text-gray-700 md:items-end">
            {enlaces.map((e) => (
              <li key={e.href}>
                <a
                  href={e.href}
                  className="rounded underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
                >
                  {e.texto}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
