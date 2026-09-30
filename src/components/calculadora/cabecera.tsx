import Link from "next/link";
import type { ReactNode } from "react";

interface PropsCabecera {
  /** Centro de la cabecera: la barra de pasos. */
  centro?: ReactNode;
  /** Derecha de la cabecera: nombre del producto. */
  derecha?: ReactNode;
}

/** Marca + barra superior. Es la misma en la portada y en el recorrido. */
export function Cabecera({ centro, derecha }: PropsCabecera) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
            P
          </span>
          PreciJusto
        </Link>
        {centro}
        <div className="min-w-16 max-w-48 truncate text-right text-sm text-gray-500">{derecha}</div>
      </div>
    </header>
  );
}

export function Pie() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <p className="mx-auto w-full max-w-6xl px-4 py-6 text-center text-sm text-gray-500 sm:px-6">
        PreciJusto — Calculadora inteligente para emprendedores · Gratis · Sin registro · Privado
      </p>
    </footer>
  );
}
