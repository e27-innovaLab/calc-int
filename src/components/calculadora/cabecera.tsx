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
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="Preciar, ir al inicio" className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700">
          <Logo />
        </Link>
        {/* En pantallas chicas los pasos bajan a su propia fila, debajo del logo y los botones. */}
        {centro ? <div className="order-last w-full lg:order-none lg:w-auto">{centro}</div> : null}
        <div className="flex items-center justify-end gap-2 text-sm text-gray-500">{derecha}</div>
      </div>
    </header>
  );
}

export function Pie() {
  return (
    <footer className="mt-auto border-t border-gray-200">
      <p className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-sm text-gray-500 sm:px-6">
        Preciar · Costos y precios claros. Gratis · Sin registro · Privado
      </p>
    </footer>
  );
}
