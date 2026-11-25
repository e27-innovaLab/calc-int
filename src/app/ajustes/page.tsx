import type { Metadata } from "next";

import { Cabecera, Pie } from "@/components/calculadora/cabecera";
import { MenuUsuario } from "@/components/calculadora/menu-usuario";
import { FormularioAjustes } from "@/components/ajustes/formulario-ajustes";
import { NavegacionCuenta } from "@/components/navegacion/navegacion-cuenta";

export const metadata: Metadata = {
  title: "Ajustes — Preciar",
  description: "Cambiá el nombre de tu cuenta o cerrá sesión",
  robots: { index: false, follow: false },
};

/** Pantalla «Ajustes» (Figma): nombre y email de la cuenta, guardar cambios y cerrar sesión. */
export default function PaginaAjustes() {
  return (
    <>
      <Cabecera centro={<NavegacionCuenta />} derecha={<MenuUsuario />} />
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
        <FormularioAjustes />
      </main>
      <Pie />
    </>
  );
}
