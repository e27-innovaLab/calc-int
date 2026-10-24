"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { calcularResumenCostos } from "@/domain/motor/costos";
import { useAnalisisPrecio } from "@/hooks/use-analisis-precio";
import { formatearCantidad, formatearMonto } from "@/lib/formato";
import { useCalculoStore } from "@/store/calculo-store";

function Fila({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-sm text-gray-700">{etiqueta}</dt>
        <dd className="text-sm font-semibold text-gray-900">{valor}</dd>
      </div>
      {nota ? <p className="text-right text-xs text-gray-500">{nota}</p> : null}
    </div>
  );
}

/** Panel lateral «Resumen en vivo»: se recalcula con cada dato que carga el usuario. */
export function ResumenEnVivo() {
  const calculo = useCalculoStore((s) => s.calculo);
  const [desglose, setDesglose] = useState(false);
  const resumen = useMemo(() => calcularResumenCostos(calculo), [calculo]);
  // En Figma, desde el paso «Precio» el panel suma precio, equilibrio y ganancia (valores que ya calcula el motor).
  const { analisis } = useAnalisisPrecio();
  const ruta = usePathname();
  const mostrarPrecio = analisis !== null && (ruta === "/calculadora/precio" || ruta === "/calculadora/simulador");
  const ganancia = analisis ? Number(analisis.gananciaNetaMensual) : 0;

  const { nombre, unidadVenta } = calculo.configuracion;
  const unidades = unidadVenta === "unidad" ? "unidades" : unidadVenta;

  let notaCostoUnitario = "Completá tus costos para ver este dato.";
  if (!resumen.volumenMensual) notaCostoUnitario = "Completá las unidades por mes en «Tu producto».";
  else if (!resumen.tieneCostosFijos && !resumen.tieneCostosVariables) notaCostoUnitario = "Completá tus costos para ver este dato.";
  else if (!resumen.tieneCostosVariables) notaCostoUnitario = "Falta el costo variable por unidad.";
  else if (!resumen.tieneCostosFijos) notaCostoUnitario = "Falta cargar costos fijos o tu tiempo.";

  const costoUnitarioListo = resumen.costoUnitario !== null && resumen.tieneCostosFijos && resumen.tieneCostosVariables;

  return (
    <aside aria-label="Resumen en vivo" className="rounded-2xl border border-accent-400/40 bg-primary-100 p-5 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-widest text-primary-900">Resumen en vivo</h2>

      <div className="mt-3">
        <p className="font-semibold text-gray-900">{nombre.trim() || "Tu producto"}</p>
        <p className="text-sm text-gray-700">
          {resumen.volumenMensual ? `${formatearCantidad(resumen.volumenMensual)} ${unidades}/mes` : "Completá las unidades por mes"}
        </p>
      </div>

      <dl className="mt-4 flex flex-col gap-3">
        <Fila
          etiqueta="Costo Fijo Total/mes"
          valor={resumen.tieneCostosFijos ? formatearMonto(resumen.costoFijoTotalMensual) : "—"}
          nota={resumen.tieneCostosFijos ? undefined : "Completá tus costos fijos"}
        />
        {resumen.tieneCostosFijos ? (
          <div>
            <button
              type="button"
              aria-expanded={desglose}
              onClick={() => setDesglose((v) => !v)}
              className="text-sm font-medium text-primary-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary-600"
            >
              {desglose ? "ocultar desglose ▲" : "ver desglose ▼"}
            </button>
            {desglose ? (
              <div className="mt-2 flex flex-col gap-1.5 border-l-2 border-accent-400/50 pl-3">
                <Fila etiqueta="Gastos fijos" valor={formatearMonto(resumen.totalGastosFijosMensual)} />
                <Fila etiqueta="Tu tiempo" valor={formatearMonto(resumen.totalTrabajoPropioMensual)} />
                <Fila etiqueta="Indirectos" valor={formatearMonto(resumen.totalIndirectosMensual)} />
              </div>
            ) : null}
          </div>
        ) : null}
        <Fila
          etiqueta="Variables/unidad"
          valor={resumen.tieneCostosVariables ? formatearMonto(resumen.costoVariableUnitario) : "—"}
          nota={resumen.tieneCostosVariables ? undefined : "Completá costos variables"}
        />
      </dl>

      <div className="mt-4 border-t border-accent-400/50 pt-4" aria-live="polite">
        <p className="text-sm text-gray-700">Costo unitario real</p>
        <p className={`mt-1 text-3xl font-bold ${costoUnitarioListo ? "text-primary-700" : "text-gray-500"}`}>
          {costoUnitarioListo ? formatearMonto(resumen.costoUnitario) : "$ —"}
        </p>
        {costoUnitarioListo ? null : <p className="mt-1 text-xs text-gray-500">{notaCostoUnitario}</p>}
      </div>

      {mostrarPrecio && analisis ? (
        <dl className="mt-4 flex flex-col gap-2 border-t border-accent-400/50 pt-4" aria-live="polite">
          <Fila etiqueta="Precio de venta" valor={formatearMonto(analisis.precio)} />
          <Fila
            etiqueta="Punto de equilibrio"
            valor={analisis.puntoEquilibrioUnidades ? `${formatearCantidad(analisis.puntoEquilibrioUnidades)} ${unidades}` : "—"}
          />
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-sm text-gray-700">Ganancia/mes</dt>
            <dd className={`text-sm font-bold ${ganancia < 0 ? "text-danger-700" : "text-success-700"}`}>
              {formatearMonto(analisis.gananciaNetaMensual)}
            </dd>
          </div>
        </dl>
      ) : null}
    </aside>
  );
}
