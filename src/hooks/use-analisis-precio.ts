"use client";

import { useMemo } from "react";

import { calcularResumenCostos } from "@/domain/motor/costos";
import { analizarPrecio, datosGrafico, precioElegido } from "@/domain/motor/precio";
import { useCalculoStore } from "@/store/calculo-store";

/** Costos, precio elegido y análisis del paso 4, recalculados cuando cambia el borrador. */
export function useAnalisisPrecio() {
  const calculo = useCalculoStore((s) => s.calculo);
  return useMemo(() => {
    const resumen = calcularResumenCostos(calculo);
    const precio = precioElegido(calculo);
    return {
      calculo,
      resumen,
      precio,
      analisis: precio ? analizarPrecio(calculo, precio) : null,
      grafico: precio ? datosGrafico(calculo, precio) : null,
    };
  }, [calculo]);
}
