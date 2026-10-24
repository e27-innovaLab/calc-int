/*Pagina de prueba para crear formulario, despues terminar de comentar como corresponde (aunque no es importante)*/

import { db } from "@/db";
import { calculos } from "@/db/schema";
import { eq } from "drizzle-orm";
import FormularioCargado from "./FormularioCargado"; // O podés pasarlo directo

export default async function CargarCalculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const resultado = await db
    .select()
    .from(calculos)
    .where(eq(calculos.id, id));

  if (resultado.length === 0) {
    return (
      <main className="p-8 text-center text-red-600 font-bold">
        No se encontró el cálculo solicitado.
      </main>
    );
  }

  const datos = resultado[0].datosFormulario as any;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">PreciJusto — Proyecto Compartido</h1>
        <p className="text-sm text-zinc-500">Cargado directamente desde Neon.</p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del Proyecto</label>
          <input
            type="text"
            defaultValue={datos.nombreProyecto || ""}
            className="w-full rounded border p-2 bg-transparent"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Precio ($)</label>
            <input
              type="number"
              defaultValue={datos.precio || ""}
              className="w-full rounded border p-2 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Cantidad</label>
            <input
              type="number"
              defaultValue={datos.cantidad || ""}
              className="w-full rounded border p-2 bg-transparent"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
