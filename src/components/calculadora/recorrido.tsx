"use client";

import { usePathname, useRouter } from "next/navigation";
import { Fragment, useState, type ReactNode } from "react";

import { DialogoConfirmar } from "@/components/ui/dialogo-confirmar";

import { useHidratado } from "@/hooks/use-hidratado";
import { useCalculoStore } from "@/store/calculo-store";

import { Cabecera, Pie } from "./cabecera";
import { GraficoPrecio } from "./grafico-precio";
import { Hidratador } from "./hidratador";
import { Pasos } from "./pasos";
import { ResumenEnVivo } from "./resumen-en-vivo";

function NombreDelProducto() {
  const nombre = useCalculoStore((s) => s.calculo.configuracion.nombre);
  return <>{nombre.trim()}</>;
}

/** «Reiniciar»: borra el borrador y vuelve al paso 1, previa confirmación. */
function BotonReiniciar({ alReiniciar }: { alReiniciar: () => void }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const reiniciar = useCalculoStore((s) => s.reiniciar);

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="text-sm font-medium text-gray-500 underline-offset-2 hover:text-gray-900 hover:underline focus-visible:outline-2 focus-visible:outline-primary-600"
      >
        Reiniciar
      </button>
      <DialogoConfirmar
        abierto={confirmando}
        titulo="¿Empezar de nuevo?"
        descripcion="Vas a borrar todo lo que cargaste (producto, costos y tiempo) y volver al paso 1. Esta acción no se puede deshacer."
        etiquetaConfirmar="Sí, reiniciar"
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => {
          reiniciar();
          alReiniciar();
          router.push("/calculadora/producto");
        }}
      />
    </>
  );
}

/** Marco del recorrido: cabecera con pasos, contenido del paso y panel «Resumen en vivo». */
export function Recorrido({ children }: { children: ReactNode }) {
  const hidratado = useHidratado();
  const ruta = usePathname();
  const enPrecio = ruta === "/calculadora/precio";
  // El simulador usa todo el ancho: el diseño no lleva panel lateral en este paso.
  const sinPanel = ruta === "/calculadora/simulador";
  // Al reiniciar se vuelve a montar el contenido, así los formularios toman los valores iniciales.
  const [version, setVersion] = useState(0);

  return (
    <>
      <Hidratador />
      <Cabecera
        centro={<Pasos />}
        derecha={
          hidratado ? (
            <div className="flex flex-col items-end gap-0.5">
              <NombreDelProducto />
              <BotonReiniciar alReiniciar={() => setVersion((v) => v + 1)} />
            </div>
          ) : null
        }
      />
      <div
        className={`mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:py-12 ${
          sinPanel ? "" : "lg:grid-cols-[minmax(0,1fr)_20rem]"
        }`}
      >
        <main id="contenido" className="min-w-0">
          <Fragment key={version}>{children}</Fragment>
        </main>
        {sinPanel ? null : (
          <div className="lg:sticky lg:top-6 lg:self-start">
            {/* En el paso «Precio» el diseño reemplaza el panel lateral por el gráfico de equilibrio. */}
            {enPrecio ? (
              <GraficoPrecio />
            ) : hidratado ? (
              <ResumenEnVivo />
            ) : null}
          </div>
        )}
      </div>
      <Pie />
    </>
  );
}
