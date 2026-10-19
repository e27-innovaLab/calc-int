import Link from "next/link";
import type { ComponentProps } from "react";

type Variante = "primario" | "secundario" | "peligro";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-primary-600 text-white shadow-sm hover:bg-primary-700",
  secundario: "border border-gray-400 bg-white text-gray-700 hover:bg-gray-50",
  peligro: "bg-danger-700 text-white shadow-sm hover:bg-danger-600",
};

export function clasesBoton(variante: Variante = "primario", extra = ""): string {
  return `${BASE} ${VARIANTES[variante]} ${extra}`.trim();
}

interface PropsBoton extends ComponentProps<"button"> {
  variante?: Variante;
}

export function Boton({ variante = "primario", className = "", type = "button", ...resto }: PropsBoton) {
  return <button type={type} className={clasesBoton(variante, className)} {...resto} />;
}

interface PropsBotonLink extends ComponentProps<typeof Link> {
  variante?: Variante;
}

export function BotonLink({ variante = "primario", className = "", ...resto }: PropsBotonLink) {
  return <Link className={clasesBoton(variante, className)} {...resto} />;
}
