import type { ComponentProps } from "react";

/** Contenedor blanco con borde y sombra suave (las «cards» del diseño). */
export function Tarjeta({ className = "", ...resto }: ComponentProps<"section">) {
  return (
    <section
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm ${className}`.trim()}
      {...resto}
    />
  );
}
