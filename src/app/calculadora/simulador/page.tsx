import type { Metadata } from "next";

import { VistaSimulador } from "@/components/calculadora/vista-simulador";

export const metadata: Metadata = { title: "Simulador · PreciJusto" };

export default function SimuladorPage() {
  return <VistaSimulador />;
}
