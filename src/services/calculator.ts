import {Decimal} from "decimal.js";
import { CalculateRequest } from "../schemas/calculator.schema.js";

const CERO = new Decimal(0);

function leerNumero(v: string): Decimal | null {
  if (!v || v.trim() === "") return null;
  try {
    const d = new Decimal(v.trim());
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

function importeValido(v: string): Decimal {
  const d = leerNumero(v);
  return d && !d.isNegative() ? d : CERO;
}

function aMensual(monto: Decimal, frecuencia: "semanal" | "mensual" | "anual"): Decimal {
  if (frecuencia === "semanal") return monto.times(4);
  if (frecuencia === "anual") return monto.dividedBy(12);
  return monto;
}

function montoMensual(montoStr: string, frecuencia: "semanal" | "mensual" | "anual"): Decimal {
  return aMensual(importeValido(montoStr), frecuencia);
}

export class CalculatorService {
  public static calcular(input: CalculateRequest) {
    // 1. Resumen de Costos
    const gastosFijos = input.costosFijos.reduce(
      (tot, c) => tot.plus(montoMensual(c.monto, c.frecuencia)),
      CERO
    );
    const indirectos = input.costosIndirectos.reduce(
      (tot, c) => tot.plus(montoMensual(c.monto, c.frecuencia)),
      CERO
    );

    const t = input.trabajoPropio;
    const trabajo = t.incluir
      ? importeValido(t.horasMensuales).times(importeValido(t.valorHora))
      : CERO;

    const costoFijoTotal = gastosFijos.plus(indirectos).plus(trabajo);
    const cvu = input.costosVariables.reduce(
      (tot, c) => tot.plus(importeValido(c.montoUnitario)),
      CERO
    );

    const volumen = leerNumero(input.configuracion.volumenMensual);
    const volumenValido = volumen && volumen.isPositive() && !volumen.isZero() ? volumen : null;

    const costoTotal = volumenValido ? costoFijoTotal.plus(cvu.times(volumenValido)) : null;
    const costoUnitario = costoTotal && volumenValido ? costoTotal.dividedBy(volumenValido) : null;

    const resumenCostos = {
      totalGastosFijosMensual: gastosFijos.toString(),
      totalIndirectosMensual: indirectos.toString(),
      totalTrabajoPropioMensual: trabajo.toString(),
      costoFijoTotalMensual: costoFijoTotal.toString(),
      costoVariableUnitario: cvu.toString(),
      volumenMensual: volumenValido ? volumenValido.toString() : null,
      costoTotalMensual: costoTotal ? costoTotal.toString() : null,
      costoUnitario: costoUnitario ? costoUnitario.toString() : null,
    };

    // 2. Precio Sugerido y Análisis de Precio / Punto de Equilibrio
    let precioElegidoDecimal: Decimal | null = null;
    let precioSugeridoStr: string | null = null;

    if (costoUnitario) {
      const margenPct = input.precio?.margenPct ?? "40";
      const m = leerNumero(margenPct);
      if (m && m.greaterThanOrEqualTo(0) && m.lessThan(100)) {
        precioSugeridoStr = costoUnitario.dividedBy(new Decimal(1).minus(m.dividedBy(100))).toString();
      }

      if (input.precio?.modo === "manual") {
        const pMan = leerNumero(input.precio.precioManual);
        if (pMan && pMan.greaterThan(0)) precioElegidoDecimal = pMan;
      } else if (precioSugeridoStr) {
        precioElegidoDecimal = new Decimal(precioSugeridoStr);
      }
    }

    let analisisPrecio = null;
    if (precioElegidoDecimal && volumenValido && costoUnitario && costoTotal) {
      const contribucion = precioElegidoDecimal.minus(cvu);
      const ingresos = precioElegidoDecimal.times(volumenValido);

      let puntoEquilibrio: string | null = null;
      let facturacionMinima: string | null = null;
      let estado: "supera" | "bajo" | "inalcanzable" = "inalcanzable";

      if (contribucion.greaterThan(0)) {
        const exacto = costoFijoTotal.dividedBy(contribucion);
        const redondeado = exacto.ceil();
        puntoEquilibrio = redondeado.toString();
        facturacionMinima = exacto.times(precioElegidoDecimal).toString();
        estado = volumenValido.greaterThanOrEqualTo(redondeado) ? "supera" : "bajo";
      }

      analisisPrecio = {
        precio: precioElegidoDecimal.toString(),
        margenResultantePct: precioElegidoDecimal
          .minus(costoUnitario)
          .dividedBy(precioElegidoDecimal)
          .times(100)
          .toString(),
        contribucion: contribucion.toString(),
        contribucionPct: contribucion.dividedBy(precioElegidoDecimal).times(100).toString(),
        ingresosTotalesMensual: ingresos.toString(),
        costosTotalesMensual: costoTotal.toString(),
        gananciaNetaMensual: ingresos.minus(costoTotal).toString(),
        puntoEquilibrioUnidades: puntoEquilibrio,
        facturacionMinima,
        estado,
      };
    }

    // 3. Simulador de Escenarios
    let simulacion = null;
    if (input.simulacion && precioElegidoDecimal && volumenValido) {
      const v = leerNumero(input.simulacion.variacionPct);
      if (v) {
        const limitada = Decimal.min(Decimal.max(v, -50), 100);
        const factor = new Decimal(1).plus(limitada.dividedBy(100));

        const nuevoCvu = input.simulacion.tipo === "insumos" ? cvu.times(factor) : cvu;
        const nuevoVolumen = input.simulacion.tipo === "produccion" ? volumenValido.times(factor) : volumenValido;
        const nuevoPrecio = input.simulacion.tipo === "precio" ? precioElegidoDecimal.times(factor) : precioElegidoDecimal;

        const nuevoCostoTotal = costoFijoTotal.plus(nuevoCvu.times(nuevoVolumen));
        const nuevosIngresos = nuevoPrecio.times(nuevoVolumen);
        const nuevaGanancia = nuevosIngresos.minus(nuevoCostoTotal);
        const nuevaContribucion = nuevoPrecio.minus(nuevoCvu);
        const nuevoEquilibrioExacto = nuevaContribucion.greaterThan(0) ? costoFijoTotal.dividedBy(nuevaContribucion) : null;

        simulacion = {
          costoUnitario: nuevoCostoTotal.dividedBy(nuevoVolumen).toString(),
          precio: nuevoPrecio.toString(),
          puntoEquilibrio: nuevoEquilibrioExacto ? nuevoEquilibrioExacto.ceil().toString() : null,
          gananciaMensual: nuevaGanancia.toString(),
          margenNetoPct: nuevosIngresos.isZero() ? "0" : nuevaGanancia.dividedBy(nuevosIngresos).times(100).toString(),
          metaVentas: nuevoEquilibrioExacto ? nuevoEquilibrioExacto.ceil().times("1.3").ceil().toString() : null,
        };
      }
    }

    return {
      resumenCostos,
      precioSugerido: precioSugeridoStr,
      analisisPrecio,
      simulacion,
    };
  }
}