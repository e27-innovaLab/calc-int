import type { Metadata } from "next";
import { Suspense } from "react";

import { Cabecera, Pie } from "@/components/calculadora/cabecera";
import { FormularioRestablecer } from "@/components/cuenta/formulario-restablecer";
import { Tarjeta } from "@/components/ui/tarjeta";

export const metadata: Metadata = {
  title: "Nueva contraseña — Preciar",
  description: "Elegí una contraseña nueva para tu cuenta",
  // El enlace lleva un token personal: no se indexa ni se manda el referrer a otros sitios.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PaginaRestablecer() {
  return (
    <>
      <Cabecera />
      <main id="contenido" className="mx-auto w-full max-w-md flex-1 px-4 py-10 sm:px-6 lg:py-16">
        <Suspense
          fallback={
            <Tarjeta aria-busy="true">
              <p className="text-sm text-gray-700">Cargando…</p>
            </Tarjeta>
          }
        >
          <FormularioRestablecer />
        </Suspense>
      </main>
      <Pie />
    </>
  );
}
