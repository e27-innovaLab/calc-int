import type { ReactNode } from "react";

import { Recorrido } from "@/components/calculadora/recorrido";

export default function CalculadoraLayout({ children }: { children: ReactNode }) {
  return <Recorrido>{children}</Recorrido>;
}
