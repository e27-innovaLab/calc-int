import type { ReactNode } from "react";

import { IndicadorCambio } from "@/components/ui/indicador-cambio";
import { Tarjeta } from "@/components/ui/tarjeta";
import {
  compararConBase,
  escalaDeGanancias,
  escenariosDeMayorGanancia,
  type ComparacionConBase,
  type IndicadorId,
} from "@/domain/motor/comparacion";
import type { ResultadoEscenario, Situacion } from "@/domain/motor/escenarios";
import type { EscenarioUsuario } from "@/domain/types";
import { formatearCantidad, formatearMonto, formatearPorcentaje } from "@/lib/formato";

export interface EscenarioConResultado {
  escenario: EscenarioUsuario;
  resultado: ResultadoEscenario;
}

interface Props {
  base: Situacion;
  escenarios: EscenarioConResultado[];
}

interface Fila {
  id: IndicadorId;
  etiqueta: string;
  unidad: "monto" | "unidades" | "puntos";
  valor: (s: Situacion) => string;
}

const FILAS: Fila[] = [
  { id: "costoUnitario", etiqueta: "Costo unitario", unidad: "monto", valor: (s) => formatearMonto(s.costoUnitario) },
  { id: "precio", etiqueta: "Precio de venta", unidad: "monto", valor: (s) => formatearMonto(s.precio) },
  { id: "margenNeto", etiqueta: "Margen neto", unidad: "puntos", valor: (s) => formatearPorcentaje(s.margenNetoPct) },
  {
    id: "puntoEquilibrio",
    etiqueta: "Punto de equilibrio",
    unidad: "unidades",
    valor: (s) => (s.puntoEquilibrio ? `${formatearCantidad(s.puntoEquilibrio)} uds` : "—"),
  },
  { id: "gananciaMensual", etiqueta: "Ganancia mensual", unidad: "monto", valor: (s) => formatearMonto(s.gananciaMensual) },
];

/** «+23%», «-10%» o «0%», con el cambio ya entero (los sliders van de a 1). */
function pctEntero(valor: string): string {
  const n = Number(valor);
  if (!Number.isFinite(n) || n === 0) return "0%";
  return `${n > 0 ? "+" : ""}${n}%`;
}

function Chip({ children, tono = "info" }: { children: ReactNode; tono?: "info" | "destacado" }) {
  const clases = tono === "destacado" ? "bg-success-100 text-success-700" : "bg-primary-100 text-primary-700";
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${clases}`}>{children}</span>;
}

/**
 * «Comparación con tu situación actual» (diseño de la issue #19): una tabla con la situación base y hasta
 * 6 escenarios, y las barras de ganancia mensual con una línea en el valor de la base.
 */
export function ComparacionEscenarios({ base, escenarios }: Props) {
  if (escenarios.length === 0) return null;

  const comparaciones: ComparacionConBase[] = escenarios.map((e) => compararConBase(base, e.resultado));
  const destacados = escenariosDeMayorGanancia(
    base,
    escenarios.map((e) => ({ id: e.escenario.id, gananciaMensual: e.resultado.gananciaMensual })),
  );

  const escala = escalaDeGanancias(
    [base.gananciaMensual, ...escenarios.map((e) => e.resultado.gananciaMensual)],
    base.gananciaMensual,
  );

  return (
    <section aria-labelledby="comparacion-titulo" className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-700">Base vs. alternativas</p>
        <h2 id="comparacion-titulo" className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
          Comparación con tu situación actual
        </h2>
        <p className="mt-1 text-sm text-gray-500">Desplazá la tabla para revisar todos los escenarios.</p>
      </div>

      {/*
        Figma: un escenario por fila (primero la situación actual) y un indicador por columna.
        `relative`: los textos sr-only de las celdas (posición absoluta) quedan dentro del recuadro con scroll;
        sin esto, en celular estiraban la página a lo ancho.
      */}
      <div
        className="relative overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm"
        role="region"
        tabIndex={0}
        aria-label="Tabla de comparación, desplazable"
      >
        <table className="w-full min-w-max border-collapse text-left">
          <caption className="sr-only">
            Comparación de cada escenario con tu situación actual: costo unitario, precio de venta, margen neto, punto de
            equilibrio y ganancia mensual.
          </caption>
          <thead>
            <tr className="bg-gray-50">
              <th scope="col" className="w-48 bg-gray-50 p-4 align-middle text-xs font-semibold text-gray-700 md:sticky md:left-0 md:z-10">
                Escenario
              </th>
              {FILAS.map((fila) => (
                <th key={fila.id} scope="col" className="min-w-36 border-l border-gray-200 p-4 align-middle text-xs font-semibold text-gray-700">
                  {fila.etiqueta}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <FilaComparacion
              nombre="Situación actual (base)"
              variaciones="Costos 0% · Precio 0% · Volumen 0%"
              situacion={base}
              comparacion={compararConBase(base, base)}
            />
            {escenarios.map(({ escenario, resultado }, i) => (
              <FilaComparacion
                key={escenario.id}
                nombre={escenario.nombre}
                variaciones={`Costos ${pctEntero(escenario.insumosPct)} · Precio ${pctEntero(escenario.precioPct)} · Volumen ${pctEntero(escenario.produccionPct)}`}
                situacion={resultado}
                comparacion={comparaciones[i]}
                destacado={destacados.includes(escenario.id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Tarjeta aria-labelledby="barras-ganancia-titulo" className="flex flex-col gap-4">
        <div>
          <h3 id="barras-ganancia-titulo" className="text-base font-bold text-gray-900">
            Ganancia mensual
          </h3>
          <p className="mt-1 text-sm text-gray-500">La línea punteada marca el valor de tu situación actual.</p>
        </div>
        <ul className="flex flex-col gap-3">
          <FilaBarra
            nombre="Situación actual"
            valor={base.gananciaMensual}
            barra={escala.barras[0]}
            basePct={escala.basePct}
            ceroPct={escala.ceroPct}
            esBase
          />
          {escenarios.map(({ escenario, resultado }, i) => (
            <FilaBarra
              key={escenario.id}
              nombre={escenario.nombre}
              valor={resultado.gananciaMensual}
              barra={escala.barras[i + 1]}
              basePct={escala.basePct}
              ceroPct={escala.ceroPct}
            />
          ))}
        </ul>
      </Tarjeta>
    </section>
  );
}

/** Una fila de la tabla: el escenario (nombre y variaciones) y sus cinco indicadores con el cambio contra la base. */
function FilaComparacion({
  nombre,
  variaciones,
  situacion,
  comparacion,
  destacado = false,
}: {
  nombre: string;
  variaciones: string;
  situacion: Situacion;
  comparacion: ComparacionConBase;
  destacado?: boolean;
}) {
  return (
    <tr className="border-t border-gray-200">
      <th scope="row" className="w-48 bg-white p-4 align-top font-normal md:sticky md:left-0 md:z-10">
        <span className="block text-sm font-semibold text-gray-900">{nombre}</span>
        <span className="mt-1 block text-xs text-gray-700">{variaciones}</span>
        {destacado ? (
          <span className="mt-2 inline-block">
            <Chip tono="destacado">Mayor ganancia</Chip>
          </span>
        ) : null}
      </th>
      {FILAS.map((fila) => (
        <td key={fila.id} className="min-w-36 border-l border-gray-200 p-4 align-top">
          <span className="block text-sm font-bold text-gray-900">{fila.valor(situacion)}</span>
          <IndicadorCambio cambio={comparacion[fila.id]} unidad={fila.unidad} nombre={fila.etiqueta} />
        </td>
      ))}
    </tr>
  );
}

function FilaBarra({
  nombre,
  valor,
  barra,
  basePct,
  ceroPct,
  esBase = false,
}: {
  nombre: string;
  valor: string;
  barra: { inicioPct: number; anchoPct: number };
  basePct: number;
  ceroPct: number | null;
  esBase?: boolean;
}) {
  const negativa = Number(valor) < 0;
  const colorBarra = esBase ? "bg-gray-900" : negativa ? "bg-danger-600" : "bg-primary-600";

  return (
    <li className="grid grid-cols-[6.5rem_1fr_5.5rem] items-center gap-3 text-sm sm:grid-cols-[9rem_1fr_6.5rem]">
      <span className="truncate font-semibold text-gray-700">{nombre}</span>
      <div aria-hidden="true" className="relative h-6 rounded-full bg-gray-100">
        <div
          className={`absolute inset-y-0 rounded-full ${colorBarra}`}
          style={{ left: `${barra.inicioPct}%`, width: `${barra.anchoPct}%` }}
        />
        {ceroPct !== null ? (
          <div className="absolute inset-y-0 border-l border-gray-400" style={{ left: `${ceroPct}%` }} />
        ) : null}
        <div
          className="absolute -inset-y-1 border-l-2 border-dashed border-gray-900"
          style={{ left: `${basePct}%` }}
        />
      </div>
      <span className="text-right font-bold text-gray-900">{formatearMonto(valor)}</span>
    </li>
  );
}
