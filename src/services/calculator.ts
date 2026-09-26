import {Decimal} from "decimal.js";
import { CalculoInputDTO, ResultadoCostosDTO, DecimalString } from "../types/calculator.js";

// Refactorizamos el servicio para procesar las cadenas DecimalString, calcular los subtotales de las 4 categorías y devolver los valores serializados.
// Configurar redondeo estándar financiero a medio arriba
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export function toDecimal(val?: DecimalString): Decimal {
  if (!val || val.trim() === "") return new Decimal(0);
  try {
    const d = new Decimal(val.trim());
    return d.isFinite() ? d : new Decimal(0);
  } catch {
    return new Decimal(0);
  }
}

export class FinancialCalculatorService {
  public calculateCosts(input: CalculoInputDTO): ResultadoCostosDTO {
    const volumen = toDecimal(input.configuracion.volumenEstimado);
    if (volumen.lte(0)) {
      throw new Error("El volumen estimado debe ser mayor a cero.");
    }

    // 1. Total Trabajo Propio (Consolidado como Costo Fijo Mensual/Período)
    let totalTrabajoPropio = new Decimal(0);
    if (input.trabajoPropio && input.trabajoPropio.incluir) {
      const horas = toDecimal(input.trabajoPropio.horasPeriodo);
      const valorHora = toDecimal(input.trabajoPropio.valorHora);
      totalTrabajoPropio = horas.mul(valorHora);
    }

    // 2. Total Costos Fijos del Período (Fijos Base + Trabajo Propio)
    const fijosBase = input.costosFijos.reduce(
      (sum, item) => sum.plus(toDecimal(item.montoPeriodo)),
      new Decimal(0)
    );
    const totalCostosFijos = fijosBase.plus(totalTrabajoPropio);

    // 3. Costo Variable Unitario (Insumos/Materiales)
    const costoVariableUnitario = input.costosVariables.reduce(
      (sum, item) => sum.plus(toDecimal(item.montoUnitario)),
      new Decimal(0)
    );

    // 4. Costos Indirectos del Período
    let totalIndirectosPeriodo = new Decimal(0);
    input.costosIndirectos.forEach((item) => {
      const monto = toDecimal(item.monto);
      if (item.base === "unidad") {
        totalIndirectosPeriodo = totalIndirectosPeriodo.plus(monto.mul(volumen));
      } else {
        totalIndirectosPeriodo = totalIndirectosPeriodo.plus(monto);
      }
    });

    // 5. Costo Total del Período
    // Costo Total = Costos Fijos Totales + (CVU * Volumen) + Costos Indirectos Totales
    const costoVariablesTotal = costoVariableUnitario.mul(volumen);
    const costoTotalPeriodo = totalCostosFijos
      .plus(costoVariablesTotal)
      .plus(totalIndirectosPeriodo);

    // 6. Costo Unitario Total = Costo Total del Período / Volumen
    const costoUnitario = costoTotalPeriodo.div(volumen);

    return {
      totalCostosFijos: totalCostosFijos.toString(),
      costoVariableUnitario: costoVariableUnitario.toString(),
      totalIndirectosPeriodo: totalIndirectosPeriodo.toString(),
      totalTrabajoPropio: totalTrabajoPropio.toString(),
      costoTotalPeriodo: costoTotalPeriodo.toString(),
      costoUnitario: costoUnitario.toString(),
    };
  }
}