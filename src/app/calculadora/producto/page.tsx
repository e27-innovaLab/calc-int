import type { Metadata } from "next";

import { FormularioProducto } from "@/components/calculadora/formulario-producto";

export const metadata: Metadata = { title: "Tu producto · Preciar" };

export default function ProductoPage() {
  return <FormularioProducto />;
}
