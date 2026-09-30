import type { Metadata } from "next";

import { VistaPrecio } from "@/components/calculadora/vista-precio";

export const metadata: Metadata = { title: "Precio · PreciJusto" };

export default function PrecioPage() {
  return <VistaPrecio />;
}
