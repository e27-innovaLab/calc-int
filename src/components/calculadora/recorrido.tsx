"use client";

import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

import { hayResumenParaDescargar, imprimirResumen } from "@/components/calculadora/descargar-resumen";
import { DialogoConfirmar } from "@/components/ui/dialogo-confirmar";

import { useHidratado } from "@/hooks/use-hidratado";
import { useCalculoStore } from "@/store/calculo-store";

import { Cabecera, Pie } from "./cabecera";
import { Hidratador } from "./hidratador";
import { MenuUsuario } from "./menu-usuario";
import { Onboarding } from "./onboarding";
import { Pasos } from "./pasos";
import { ResumenEnVivo } from "./resumen-en-vivo";

/** Píldora con el nombre del producto (o «Sin nombre» mientras no se cargó). */
function NombreDelProducto() {
  const nombre = useCalculoStore((s) => s.calculo.configuracion.nombre).trim();
  return (
    <span className="min-w-0 max-w-24 truncate rounded-md bg-warning-100 px-2.5 py-1 text-xs font-semibold text-gray-900 md:max-w-40">
      {nombre || "Sin nombre"}
    </span>
  );
}

/** «Reiniciar»: borra el borrador y vuelve al paso 1, previa confirmación. */
function BotonReiniciar({ alReiniciar }: { alReiniciar: () => void }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  // El enlace «Descargar mi resumen» solo tiene sentido donde hay un resumen para guardar (el simulador).
  const [puedeGuardar, setPuedeGuardar] = useState(false);
  const reiniciar = useCalculoStore((s) => s.reiniciar);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setPuedeGuardar(hayResumenParaDescargar());
          setConfirmando(true);
        }}
        className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
      >
        <span aria-hidden="true">↻</span>
        {/* Figma mobile: solo el ícono. El texto sigue ahí para los lectores de pantalla. */}
        <span className="sr-only md:not-sr-only">Reiniciar</span>
      </button>
      <DialogoConfirmar
        abierto={confirmando}
        titulo="¿Confirmar reinicio?"
        descripcion="Los datos cargados se van a borrar para iniciar un nuevo cálculo."
        etiquetaConfirmar="Confirmar"
        icono={<span className="text-lg leading-none">↻</span>}
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => {
          // Cierra el diálogo primero: si ya se está en el paso 1 la ruta no cambia y, sin esto, quedaba abierto.
          setConfirmando(false);
          reiniciar();
          alReiniciar();
          router.push("/calculadora/producto");
        }}
      >
        {puedeGuardar ? (
          <button
            type="button"
            onClick={() => {
              setConfirmando(false);
              requestAnimationFrame(imprimirResumen);
            }}
            className="rounded text-sm font-medium text-gray-900 underline underline-offset-4 hover:text-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
          >
            Descargar mi resumen antes de reiniciar
          </button>
        ) : null}
      </DialogoConfirmar>
    </>
  );
}

/**
 * Columna del «Resumen en vivo» y la ayuda del paso. En escritorio se queda fija al hacer scroll, pero solo si entra
 * completa en la pantalla: si es más alta que la ventana (notebooks de ~650 px de alto, o pasos con mucho contenido)
 * quedaba con scroll propio y la ayuda cortada. En ese caso baja con la página, como el resto del contenido.
 */
function ColumnaLateral({ hidratado }: { hidratado: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fija, setFija] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 56 px = separación de arriba (top-6) y un margen de abajo.
    const medir = () =>
      setFija(window.matchMedia("(min-width: 64rem)").matches && el.offsetHeight + 56 <= window.innerHeight);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    window.addEventListener("resize", medir);
    return () => {
      observador.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, []);

  return (
    // Figma mobile: el «Resumen en vivo» va arriba del contenido; en escritorio, a la derecha.
    <div
      ref={ref}
      className={`order-first flex flex-col gap-4 lg:order-none lg:-m-1 lg:self-start lg:p-1${fija ? " lg:sticky lg:top-6" : ""}`}
    >
      {/* En Figma el panel «Resumen en vivo» acompaña todos los pasos, también el simulador (Paso 5). */}
      {/* Antes de leer el borrador se reserva el alto del panel (invisible) para que el contenido no se corra. */}
      <div className={hidratado ? undefined : "invisible"}>
        <ResumenEnVivo />
      </div>
      {/* Figma «Onboarding»: la ayuda del paso, abajo de la columna del resumen. */}
      {hidratado ? <Onboarding /> : null}
    </div>
  );
}

/** Marco del recorrido: cabecera con pasos, contenido del paso y panel «Resumen en vivo». */
export function Recorrido({ children }: { children: ReactNode }) {
  const hidratado = useHidratado();
  // Al reiniciar se vuelve a montar el contenido, así los formularios toman los valores iniciales.
  const [version, setVersion] = useState(0);

  return (
    <>
      <Hidratador />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Saltar al contenido
      </a>
      <Cabecera
        centro={<Pasos />}
        derecha={
          // min-h-11 = alto del botón «Reiniciar»: la cabecera no crece cuando aparece después de leer el borrador.
          <div className="flex min-h-11 min-w-0 items-center gap-2">
            {/* Figma mobile no muestra el acceso a la cuenta en la cabecera: se ve desde tablet. */}
            <div className="hidden shrink-0 md:block">
              <MenuUsuario compacto />
            </div>
            {hidratado ? (
              <>
                <NombreDelProducto />
                <BotonReiniciar alReiniciar={() => setVersion((v) => v + 1)} />
              </>
            ) : null}
          </div>
        }
      />
      <div
        className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:py-12"
      >
        <main id="contenido" tabIndex={-1} className="min-w-0 focus:outline-none">
          <Fragment key={version}>{children}</Fragment>
        </main>
        {/* Figma mobile: el «Resumen en vivo» va arriba del contenido; en escritorio, a la derecha. */}
        <ColumnaLateral hidratado={hidratado} />
      </div>
      <Pie oculto={!hidratado} />
    </>
  );
}
