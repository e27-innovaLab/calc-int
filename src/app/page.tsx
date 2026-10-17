/*export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Calculadora Inteligente
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400">
        Costos, precios y punto de equilibrio para tu emprendimiento.
      </p>
      <p className="text-sm text-zinc-500">
        Proyecto base — el recorrido guiado se implementa a partir de la Semana 1.
      </p>
    </main>
  );
}
Esto lo comento para probar el formulario y base de datos
*/
"use client"; //Indica que es un client component

import { useState } from "react";


//Donde se almacenan temporalmente los valores antes de enviarlos a la DB
export default function Home() {
  //NombreProyecto
  const [nombreProyecto, setNombreProyecto] = useState("Emprendimiento Demo");
  const [precio, setPrecio] = useState("1500"); //Precio
  const [cantidad, setCantidad] = useState("10"); //Cantidad

  const [cargando, setCargando] = useState(false);
  const [linkGenerado, setLinkGenerado] = useState<string | null>(null);

//Maneja el envio del formulario: Hace un POST a la API y copia el enlace UUID
  const manejarGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    const datosFormulario = {
      nombreProyecto,
      precio,
      cantidad,
      creadoEn: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/calculo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosFormulario),
      });

      if (!res.ok) throw new Error("Error al guardar");

      const { id } = await res.json();
      const url = `${window.location.origin}/calculo/${id}`;
      setLinkGenerado(url);
      await navigator.clipboard.writeText(url);//copia automaticamente al portapepeles
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al guardar.");
    } finally {
      setCargando(false);
    }
  };

  return (
{/*Titulo y clases generales con Tailwinds CSS*/},
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-6 px-4 py-12">
      <h1 className="text-2xl font-bold">PreciJusto — Prueba de Base de Datos</h1>

{/*Tailwinds CSS del formulario */},
      <form onSubmit={manejarGuardar} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre del Proyecto</label>
          <input
            type="text"
            value={nombreProyecto}
            onChange={(e) => setNombreProyecto(e.target.value)}
            className="w-full rounded border p-2 bg-transparent"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Precio ($)</label>
            <input
              type="number"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              className="w-full rounded border p-2 bg-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cantidad</label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full rounded border p-2 bg-transparent"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={cargando}
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {cargando ? "Guardando..." : "Guardar y Generar Enlace"}
        </button>
      </form>

{/*Renderiza el contenedor de exito si el enlace fue generado sin errores */},
      {linkGenerado && (
        <div className="rounded border border-green-500 bg-green-500/10 p-4">
          <p className="text-sm font-semibold text-green-700">¡Guardado con éxito! Link copiado:</p>
          <a href={linkGenerado} className="text-blue-600 underline text-sm break-all">
            {linkGenerado}
          </a>
        </div>
      )}
    </main>
  );
}
