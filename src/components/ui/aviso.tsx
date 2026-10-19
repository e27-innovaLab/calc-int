import type { ReactNode } from "react";

type Tono = "info" | "consejo" | "advertencia";

const TONOS: Record<Tono, { caja: string; icono: string }> = {
  info: { caja: "border-primary-100 bg-primary-50 text-primary-700", icono: "ℹ" },
  consejo: { caja: "border-warning-100 bg-warning-50 text-warning-700", icono: "💡" },
  advertencia: { caja: "border-warning-500 bg-warning-100 text-warning-700", icono: "⚠" },
};

interface PropsAviso {
  tono?: Tono;
  titulo?: string;
  children: ReactNode;
}

/** Cuadro de ayuda o aviso. El ícono acompaña al color: no se depende solo del color para entenderlo. */
export function Aviso({ tono = "info", titulo, children }: PropsAviso) {
  const { caja, icono } = TONOS[tono];
  return (
    <div className={`flex gap-3 rounded-xl border p-4 text-sm ${caja}`}>
      <span aria-hidden="true" className="leading-snug">
        {icono}
      </span>
      <div className="flex flex-col gap-1">
        {titulo ? <p className="font-semibold">{titulo}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
