//Importa lo necesario para correr el archivo
import { NextResponse } from "next/server";
import { db } from "@/db";
import { calculos } from "@/db/schema";

/*Inserta los datos del formulario en la DB si todo sale bien, extra el ID generado y lo devuelve, sino atrapa el error y lo imprime por consola */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const [nuevoCalculo] = await db
      .insert(calculos)
      .values({
        datosFormulario: body,
      })
      .returning({ id: calculos.id });

    return NextResponse.json({ id: nuevoCalculo.id }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar el cálculo:", error);
    return NextResponse.json(
      { error: "Error al guardar en la base de datos" },
      { status: 500 }
    );
  }
}
