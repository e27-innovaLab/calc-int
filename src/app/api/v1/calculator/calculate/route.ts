import { NextRequest, NextResponse } from "next/server";
import { CalculateRequestSchema } from "@/schemas/calculator.schema";
import { aDecimal, aDecimalString, sumar } from "@/domain/motor/decimal";
import { aMensual } from "@/domain/motor/periodo";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validar el body entrante con el esquema de Zod
    const parseResult = CalculateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Datos de entrada inválidos", detalle: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 2. Procesar cálculos con las funciones del motor
    // Total Costos Fijos (normalizados a mensual)
    const totalFijos = data.costosFijos.reduce((acc, c) => {
      const dec = aDecimal(c.monto);
      return dec ? acc.plus(aMensual(dec, c.frecuencia)) : acc;
    }, aDecimal("0")!);

    // Total Costos Indirectos (normalizados a mensual)
    const totalIndirectos = data.costosIndirectos.reduce((acc, c) => {
      const dec = aDecimal(c.monto);
      return dec ? acc.plus(aMensual(dec, c.frecuencia)) : acc;
    }, aDecimal("0")!);

    // Total Costos Variables (suma de montos unitarios)
    const costoVariableUnitario = sumar(data.costosVariables.map((v) => v.montoUnitario));

    // Trabajo Propio (mensual)
    let totalTrabajoPropio = aDecimal("0")!;
    if (data.trabajoPropio.incluir) {
      const hs = aDecimal(data.trabajoPropio.horasMensuales);
      const val = aDecimal(data.trabajoPropio.valorHora);
      if (hs && val) {
        totalTrabajoPropio = hs.times(val);
      }
    }

    // Costo Total Mensual = Fijos + Indirectos + Trabajo Propio + (Variable Unitario * Volumen Mensual)
    const volumen = aDecimal(data.configuracion.volumenMensual) || aDecimal("1")!;
    const costoTotalMensual = totalFijos
      .plus(totalIndirectos)
      .plus(totalTrabajoPropio)
      .plus(costoVariableUnitario.times(volumen));

    const costoUnitario = costoTotalMensual.dividedBy(volumen);

    // 3. Estructurar el resultado en el formato de ResultadoCostos
    const resultado = {
      totalCostosFijosMensual: aDecimalString(totalFijos),
      totalIndirectosMensual: aDecimalString(totalIndirectos),
      totalTrabajoPropioMensual: aDecimalString(totalTrabajoPropio),
      costoVariableUnitario: aDecimalString(costoVariableUnitario),
      costoTotalMensual: aDecimalString(costoTotalMensual),
      costoUnitario: aDecimalString(costoUnitario),
    };

    return NextResponse.json({ success: true, data: resultado }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al procesar la solicitud", detalle: error.message },
      { status: 500 }
    );
  }
}