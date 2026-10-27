import { NextRequest, NextResponse } from "next/server";

import { calcularSolicitud } from "@/lib/calcular-solicitud";
import { CalculateRequestSchema } from "@/schemas/calculator.schema";

/**
 * Calcula costo unitario, precio y punto de equilibrio de un único producto.
 * No tiene fórmulas propias: usa el motor oficial (`domain/motor`) con las mismas reglas que la pantalla, para las tres
 * rutas («lotes», «unidad» y «reventa»). Ver `lib/calcular-solicitud.ts`.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud tiene que ser un JSON válido." }, { status: 400 });
  }

  const parseResult = CalculateRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Datos de entrada inválidos", detalle: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const resultado = calcularSolicitud(parseResult.data);
    if (!resultado.exito) {
      return NextResponse.json({ error: "Datos de entrada inválidos", errores: resultado.errores }, { status: 400 });
    }

    const advertencias = parseResult.data.simulacion
      ? ["«simulacion» todavía no se calcula en este endpoint: se ignoró."]
      : undefined;
    return NextResponse.json({ success: true, data: resultado.datos, ...(advertencias ? { advertencias } : {}) }, { status: 200 });
  } catch (error) {
    // Un error interno no es un error de validación y no expone detalles al cliente.
    console.error("Error al calcular la solicitud", error);
    return NextResponse.json({ error: "Error interno al procesar la solicitud." }, { status: 500 });
  }
}
