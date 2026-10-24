/*El archivo es un endpoint GET para buscar y hacer devolver lo que esta en la base de datos utilizando el UUID (columna)*/

import { NextResponse } from "next/server";
import { db } from "@/db";
import { calculos } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const resultado = await db
      .select()
      .from(calculos)
      .where(eq(calculos.id, id));

    if (resultado.length === 0) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json(resultado[0].datosFormulario);
  } catch (error) {
    console.error("Error al consultar:", error);
    return NextResponse.json({ error: "Error al consultar" }, { status: 500 });
  }
}
