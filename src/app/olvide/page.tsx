import type { Metadata } from "next";

import { Cabecera, Pie } from "@/components/calculadora/cabecera";
import { FormularioOlvide } from "@/components/cuenta/formulario-olvide";

export const metadata: Metadata = {
  title: "Restablecer contraseña — Preciar",
  description: "Pedí un enlace por correo para elegir una contraseña nueva",
  robots: { index: false, follow: false },
};

export default function PaginaOlvide() {
  return (
    <>
      <Cabecera />
      <main id="contenido" className="mx-auto w-full max-w-md flex-1 px-4 py-10 sm:px-6 lg:py-16">
        <FormularioOlvide />
      </main>
      <Pie />
    </>
  );
}
