import { OPCIONES_RUTA } from "@/components/calculadora/selector-ruta";
import { calcularResumenCostos } from "@/domain/motor/costos";
import { simularVariaciones } from "@/domain/motor/escenarios";
import { analizarPrecio, precioElegido } from "@/domain/motor/precio";
import type { Calculo } from "@/domain/types";

/**
 * Resumen numérico del cálculo (para decidir si hay algo que exportar y para nombrar el archivo).
 * OJO: lo que se envía a `POST /api/calculos/exportar-pdf` es el `Calculo` completo: el endpoint lo valida con
 * `esquemaCalculo` y arma el informe con el motor en el servidor.
 */
export interface PayloadExportarPdf {
  nombreProducto: string;
  ruta: string;
  base: {
    costoUnitario: number;
    precioVenta: number;
    margenNeto: number;
    puntoEquilibrio: number;
    gananciaMensual: number;
    volumenMensual: number;
    costosFijos: number;
    costosVariables: number;
    gastosFijos: number;
    indirectos: number;
    insumosUnitarios: number;
    facturacionMinima: number;
  };
  escenarios: {
    nombre: string;
    variacionCostos: number;
    variacionPrecio: number;
    variacionVolumen: number;
    costoUnitario: number;
    precioVenta: number;
    margenNeto: number;
    puntoEquilibrio: number;
    gananciaMensual: number;
  }[];
}

/** Resultado de pedir el PDF al servidor: `descargado`, o el motivo por el que hay que usar la impresión del navegador. */
export type ResultadoPdfServidor = "descargado" | "sin-sesion" | "no-disponible";

/** Un campo de porcentaje vacío cuenta como «sin cambio». */
const comoPct = (valor: string) => (valor.trim() === "" ? "0" : valor);

const numero = (valor: string | null | undefined): number => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Arma el cuerpo del PDF a partir de lo que ya calculó el motor (no hace cálculos propios).
 * Null si todavía no hay precio o no se puede analizar (falta volumen o costos).
 */
export function armarPayloadPdf(calculo: Calculo): PayloadExportarPdf | null {
  const precio = precioElegido(calculo);
  if (!precio) return null;
  const analisis = analizarPrecio(calculo, precio);
  if (!analisis) return null;
  const resumen = calcularResumenCostos(calculo);

  return {
    nombreProducto: calculo.configuracion.nombre.trim() || "Tu producto",
    ruta: OPCIONES_RUTA[calculo.configuracion.ruta].titulo,
    base: {
      costoUnitario: numero(resumen.costoUnitario),
      precioVenta: numero(analisis.precio),
      margenNeto: numero(analisis.margenResultantePct),
      puntoEquilibrio: numero(analisis.puntoEquilibrioUnidades),
      gananciaMensual: numero(analisis.gananciaNetaMensual),
      volumenMensual: numero(resumen.volumenMensual) || 1,
      costosFijos: numero(resumen.costoFijoTotalMensual),
      costosVariables: numero(resumen.costoVariableUnitario),
      gastosFijos: numero(resumen.totalGastosFijosMensual),
      indirectos: numero(resumen.totalIndirectosMensual),
      insumosUnitarios: numero(resumen.costoVariableUnitario),
      facturacionMinima: numero(analisis.facturacionMinima),
    },
    escenarios: calculo.escenarios.flatMap((e) => {
      const r = simularVariaciones(calculo, precio, {
        insumosPct: comoPct(e.insumosPct),
        precioPct: comoPct(e.precioPct),
        produccionPct: comoPct(e.produccionPct),
      });
      if (!r) return [];
      return [
        {
          nombre: e.nombre.trim() || "Escenario",
          variacionCostos: numero(e.insumosPct),
          variacionPrecio: numero(e.precioPct),
          variacionVolumen: numero(e.produccionPct),
          costoUnitario: numero(r.costoUnitario),
          precioVenta: numero(r.precio),
          margenNeto: numero(r.margenNetoPct),
          puntoEquilibrio: numero(r.puntoEquilibrio),
          gananciaMensual: numero(r.gananciaMensual),
        },
      ];
    }),
  };
}

/** Nombre de archivo seguro. Ej.: «Club de Nuit» → «preciar-club-de-nuit.pdf». */
function nombreArchivoPdf(producto: string): string {
  const limpio = producto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `preciar-${limpio || "reporte"}.pdf`;
}

/**
 * Pide al servidor el informe detallado en PDF (solo con sesión iniciada) y lo descarga.
 * Antes comprueba con `armarPayloadPdf` que haya precio y análisis calculables.
 * Si el servidor no responde bien (sin sesión, endpoint no publicado o error), devuelve el motivo para que la pantalla
 * use la impresión del navegador y la persona no se quede sin su resumen.
 */
export async function descargarPdfDelServidor(calculo: Calculo): Promise<ResultadoPdfServidor> {
  const payload = armarPayloadPdf(calculo);
  if (!payload) return "no-disponible";
  // Si el servidor no responde, no se deja a la persona esperando: a los 45 s se usa la impresión del navegador.
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), 45_000);
  try {
    const respuesta = await fetch("/api/calculos/exportar-pdf", {
      signal: control.signal,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // El servidor valida el cuerpo con `esquemaCalculo` (el Calculo completo), no con el resumen de `armarPayloadPdf`.
      body: JSON.stringify(calculo),
    });
    if (respuesta.status === 401) return "sin-sesion";
    if (!respuesta.ok) return "no-disponible";
    const archivo = await respuesta.blob();
    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = nombreArchivoPdf(payload.nombreProducto);
    enlace.click();
    URL.revokeObjectURL(url);
    return "descargado";
  } catch {
    return "no-disponible";
  } finally {
    clearTimeout(temporizador);
  }
}
