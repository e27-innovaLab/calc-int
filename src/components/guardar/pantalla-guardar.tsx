"use client";

import { useState } from "react";

import { Cabecera, Pie } from "@/components/calculadora/cabecera";
import { DescargarResumen } from "@/components/calculadora/descargar-resumen";
import { Hidratador } from "@/components/calculadora/hidratador";
import { MenuUsuario } from "@/components/calculadora/menu-usuario";
import { NavegacionCuenta } from "@/components/navegacion/navegacion-cuenta";
import { ResumenFinal } from "@/components/calculadora/resumen-final";
import { Aviso } from "@/components/ui/aviso";
import { BotonLink } from "@/components/ui/boton";
import { useAnalisisPrecio } from "@/hooks/use-analisis-precio";
import { useHidratado } from "@/hooks/use-hidratado";
import { cambiarCompartido, enlaceCompartido, guardarCalculo } from "@/lib/api-calculos";
import { useSession } from "@/lib/auth-client";
import { useCalculoStore } from "@/store/calculo-store";

const RUTA_VOLVER = "/calculadora/simulador";

/**
 * Pantalla «Elegí cómo guardarlo» (Figma, frames de exportar con y sin sesión).
 * A la izquierda, el resumen del cálculo; a la derecha, el panel para descargarlo, compartirlo o guardarlo.
 * No calcula nada: muestra lo que ya calculó el motor y usa las funciones de guardado que ya existen.
 */
export function PantallaGuardar() {
  return (
    <>
      <Hidratador />
      <Cabecera centro={<NavegacionCuenta />} derecha={<MenuUsuario />} />
      <main id="contenido" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:py-12">
        <Contenido />
      </main>
      <Pie />
    </>
  );
}

function Contenido() {
  const hidratado = useHidratado();
  const { calculo, resumen, analisis } = useAnalisisPrecio();

  if (!hidratado) {
    return <div aria-busy="true" aria-label="Cargando tu cálculo" className="h-96 animate-pulse rounded-2xl bg-gray-100" />;
  }

  if (!analisis) {
    return (
      <div className="flex flex-col items-start gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Todavía no hay un resumen para guardar</h1>
        <Aviso tono="advertencia">Para armar el resumen necesitamos tus costos y el precio al que vas a vender.</Aviso>
        <BotonLink href="/calculadora/producto">Ir a la calculadora</BotonLink>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <BotonLink href={RUTA_VOLVER} variante="secundario">
            ← Volver al cálculo
          </BotonLink>
        </div>
        {/* El mismo resumen que se imprime o se guarda como imagen (lleva el id «resumen-final»). */}
        <ResumenFinal calculo={calculo} resumen={resumen} analisis={analisis} conBotonPdf={false} />
      </div>
      <div className="lg:sticky lg:top-6 lg:self-start">
        <PanelExportar producto={calculo.configuracion.nombre.trim()} />
      </div>
    </div>
  );
}

const CLASES_ACCION =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 disabled:cursor-not-allowed";

/** Panel «EXPORTAR RESUMEN · Elegí cómo guardarlo». */
function PanelExportar({ producto }: { producto: string }) {
  const { data: sesion } = useSession();
  const logueado = Boolean(sesion?.user);
  const [ocupado, setOcupado] = useState<"compartir" | "guardar" | null>(null);
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);

  /** Guarda el cálculo en la cuenta (crea o actualiza). Devuelve el id guardado o `null` si falló. */
  async function guardar(): Promise<string | null> {
    const resultado = await guardarCalculo(useCalculoStore.getState().calculo);
    if (resultado.ok) return resultado.id;
    setMensaje({ texto: resultado.mensaje, error: true });
    return null;
  }

  async function alGuardar() {
    setOcupado("guardar");
    setMensaje(null);
    const id = await guardar();
    if (id) setMensaje({ texto: "Listo, tu cálculo quedó guardado. Lo encontrás en «Mis cálculos».", error: false });
    setOcupado(null);
  }

  /** Compartir: guarda (si hace falta), activa el link y lo copia. */
  async function alCompartir() {
    setOcupado("compartir");
    setMensaje(null);
    const id = await guardar();
    if (id) {
      const activado = await cambiarCompartido(id, true);
      if (!activado) {
        setMensaje({ texto: "No pudimos activar el link. Probá de nuevo.", error: true });
      } else {
        const enlace = enlaceCompartido(id);
        try {
          await navigator.clipboard.writeText(enlace);
          setMensaje({ texto: `Copiamos el link: ${enlace}`, error: false });
        } catch {
          setMensaje({ texto: `Tu link para compartir: ${enlace}`, error: false });
        }
      }
    }
    setOcupado(null);
  }

  return (
    <aside aria-labelledby="exportar-titulo" className="rounded-2xl border border-gray-300 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-900">Exportar resumen</p>
      <h1 id="exportar-titulo" className="mt-1 text-xl font-semibold text-gray-900">
        Elegí cómo guardarlo
      </h1>

      {/* PDF e imagen: el mismo bloque del paso 5 (sin sesión, el PDF queda bloqueado con la invitación a iniciar sesión). */}
      <div className="mt-4">
        <DescargarResumen producto={producto} titulo={null} />
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {logueado ? (
          <>
            <button
              type="button"
              onClick={alCompartir}
              disabled={ocupado !== null}
              aria-busy={ocupado === "compartir"}
              className={`${CLASES_ACCION} border border-primary-600 bg-primary-100 text-gray-900 hover:bg-primary-50`}
            >
              {ocupado === "compartir" ? "Preparando el link…" : "Compartir link"}
            </button>
            <button
              type="button"
              onClick={alGuardar}
              disabled={ocupado !== null}
              aria-busy={ocupado === "guardar"}
              className={`${CLASES_ACCION} border border-primary-600 bg-primary-100 text-gray-900 hover:bg-primary-50`}
            >
              {ocupado === "guardar" ? "Guardando…" : "Guardar mi cálculo"}
            </button>
          </>
        ) : (
          // Figma (sin sesión): «Compartir link» deshabilitado; para compartir hace falta guardar en una cuenta.
          <button
            type="button"
            disabled
            title="Iniciá sesión para compartir tu cálculo con un link"
            className={`${CLASES_ACCION} border border-gray-200 bg-gray-100 font-medium text-gray-500`}
          >
            Compartir link
          </button>
        )}
      </div>

      <div role="status">
        {mensaje ? (
          <p
            className={`mt-4 break-all rounded-xl border px-4 py-3 text-sm ${
              mensaje.error ? "border-danger-100 bg-danger-50 text-danger-700" : "border-success-100 bg-success-100 text-primary-900"
            }`}
          >
            {mensaje.texto}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
