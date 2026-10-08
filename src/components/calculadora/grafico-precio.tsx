"use client";

import { Tarjeta } from "@/components/ui/tarjeta";
import { useHidratado } from "@/hooks/use-hidratado";
import { useAnalisisPrecio } from "@/hooks/use-analisis-precio";
import { formatearCantidad } from "@/lib/formato";

const ANCHO = 420;
const ALTO = 260;
const MARGEN = { arriba: 12, derecha: 14, abajo: 34, izquierda: 52 };

/** Paso «bonito» (1, 2, 5 × 10ⁿ) para que el eje tenga unas 6 marcas. */
function pasoLindo(maximo: number, marcas: number): number {
  const bruto = maximo / marcas;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const f = bruto / potencia;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * potencia;
}

function abreviar(importe: number): string {
  if (importe === 0) return "$0";
  return importe >= 1000 ? `$${Math.round(importe / 1000)}k` : `$${Math.round(importe)}`;
}

/** «Ingresos vs. Costos Totales»: el cruce de las líneas es el punto de equilibrio. */
export function GraficoPrecio() {
  const hidratado = useHidratado();
  const { grafico, analisis } = useAnalisisPrecio();

  return (
    <Tarjeta aria-labelledby="titulo-grafico" className="p-5">
      <h2 id="titulo-grafico" className="font-semibold text-gray-900">
        Ingresos vs. Costos Totales
      </h2>
      <p className="mt-1 text-xs text-gray-500">El cruce de líneas es tu punto de equilibrio.</p>

      {!hidratado || !grafico ? (
        <p className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
          Elegí tu precio para ver cuándo se cruzan tus ingresos con tus costos.
        </p>
      ) : analisis?.estado === "inalcanzable" ? (
        // Contribución ≤ 0: las líneas nunca se cruzan, así que el gráfico queda bloqueado.
        <p className="mt-6 rounded-xl border border-danger-100 bg-danger-50 p-4 text-sm font-medium text-danger-700">
          Con este precio no hay punto de equilibrio, por eso no mostramos el gráfico. Subí tu precio por encima del costo
          de tus materiales para verlo.
        </p>
      ) : (
        <Grafico grafico={grafico} equilibrio={analisis?.puntoEquilibrioUnidades ?? null} />
      )}
    </Tarjeta>
  );
}

function Grafico({
  grafico,
  equilibrio,
}: {
  grafico: NonNullable<ReturnType<typeof useAnalisisPrecio>["grafico"]>;
  equilibrio: string | null;
}) {
  const { puntos, maxUnidades, maxImporte, cruce } = grafico;
  const [inicio, fin] = puntos;

  const pasoX = pasoLindo(maxUnidades, 6);
  const pasoY = pasoLindo(maxImporte, 4);
  const topeY = Math.ceil(maxImporte / pasoY) * pasoY;
  const topeX = Math.ceil(maxUnidades / pasoX) * pasoX;

  const x = (u: number) => MARGEN.izquierda + (u / topeX) * (ANCHO - MARGEN.izquierda - MARGEN.derecha);
  const y = (v: number) => ALTO - MARGEN.abajo - (v / topeY) * (ALTO - MARGEN.arriba - MARGEN.abajo);

  const marcasX = Array.from({ length: Math.floor(topeX / pasoX) + 1 }, (_, i) => i * pasoX);
  const marcasY = Array.from({ length: Math.floor(topeY / pasoY) + 1 }, (_, i) => i * pasoY);
  const linea = (campo: "ingresos" | "costos") =>
    `M${x(inicio.unidades)},${y(inicio[campo])} L${x(fin.unidades)},${y(fin[campo])}`;

  const descripcion = cruce
    ? `Gráfico de ingresos y costos totales según las unidades vendidas. Las líneas se cruzan en ${formatearCantidad(equilibrio)} unidades.`
    : "Gráfico de ingresos y costos totales según las unidades vendidas. Con este precio las líneas no se cruzan.";

  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label={descripcion} className="h-auto w-full">
        {marcasY.map((v) => (
          <g key={`y${v}`}>
            <line x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(v)} y2={y(v)} className="stroke-gray-200" strokeWidth="1" />
            <text x={MARGEN.izquierda - 6} y={y(v) + 3} textAnchor="end" className="fill-gray-500" fontSize="9">
              {abreviar(v)}
            </text>
          </g>
        ))}
        {marcasX.map((u) => (
          <text key={`x${u}`} x={x(u)} y={ALTO - MARGEN.abajo + 14} textAnchor="middle" className="fill-gray-500" fontSize="9">
            {formatearCantidad(String(u))}
          </text>
        ))}
        <text x={(MARGEN.izquierda + ANCHO - MARGEN.derecha) / 2} y={ALTO - 4} textAnchor="middle" className="fill-gray-500" fontSize="9">
          unidades
        </text>

        <path d={linea("costos")} fill="none" className="stroke-danger-600" strokeWidth="2" />
        <path d={linea("ingresos")} fill="none" className="stroke-primary-600" strokeWidth="2" />
        {cruce && cruce <= topeX ? (
          <circle cx={x(cruce)} cy={y(inicio.costos + ((fin.costos - inicio.costos) * cruce) / fin.unidades)} r="4" className="fill-white stroke-gray-900" strokeWidth="2" />
        ) : null}
      </svg>

      <ul className="mt-2 flex justify-center gap-5 text-xs text-gray-700">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 bg-danger-600" /> Costos
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-0.5 w-4 bg-primary-600" /> Ingresos
        </li>
      </ul>
    </div>
  );
}
