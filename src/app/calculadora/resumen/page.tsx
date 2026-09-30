import type { Metadata } from "next";

import { VistaResumen } from "@/components/calculadora/vista-resumen";

export const metadata: Metadata = { title: "Resumen · PreciJusto" };

export default function ResumenPage() {
  return <VistaResumen />;
}
