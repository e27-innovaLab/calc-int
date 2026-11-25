import type { Metadata } from "next";

import { PantallaGuardar } from "@/components/guardar/pantalla-guardar";

export const metadata: Metadata = {
  title: "Elegí cómo guardarlo — Preciar",
  description: "Descargá el resumen de tu cálculo en PDF o como imagen, compartilo con un link o guardalo en tu cuenta",
  // Muestra el borrador de cada persona: no tiene sentido indexarla.
  robots: { index: false, follow: false },
};

/** Pantalla «Elegí cómo guardarlo» (Figma): el resumen del cálculo y las formas de exportarlo. */
export default function PaginaGuardar() {
  return <PantallaGuardar />;
}
