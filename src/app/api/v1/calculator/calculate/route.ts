import { NextRequest, NextResponse } from "next/server";
import { CalculatorService } from "@/services/calculator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resultado = CalculatorService.calcular(body);
    return NextResponse.json(resultado);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al procesar la solicitud", detalle: error.message },
      { status: 400 }
    );
  }
}