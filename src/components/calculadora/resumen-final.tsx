"use client";

import { useEffect, useState, type ReactNode } from "react";

import { OPCIONES_RUTA } from "@/components/calculadora/selector-ruta";
import { Boton } from "@/components/ui/boton";
import { DialogoConfirmar } from "@/components/ui/dialogo-confirmar";
import { Tarjeta } from "@/components/ui/tarjeta";
import type { ResumenCostos } from "@/domain/motor/costos";
import type { AnalisisPrecio } from "@/domain/motor/precio";
import type { Calculo } from "@/domain/types";
import { nombreArchivoResumen } from "@/lib/archivo";
import { formatearCantidad, formatearMonto, formatearPorcentaje } from "@/lib/formato";

/** Clase que, mientras se imprime, deja visible solo el resumen (ver `globals.css`). */
const CLASE_IMPRIMIENDO = "imprimiendo-resumen";
/** Clase que, mientras se genera la imagen, oculta los botones del resumen (ver `globals.css`). */
const CLASE_CAPTURANDO = "capturando-imagen";

interface PropsResumenFinal {
  calculo: Calculo;
  resumen: ResumenCostos;
  analisis: AnalisisPrecio;
}

/**
 * Vista final con los principales resultados y los supuestos usados (brief, sección «Resumen»).
 * Solo MUESTRA lo que ya calculó el motor: no hace ningún cálculo propio.
 * «Guardar resumen (PDF)» abre la ventana de impresión del navegador, desde donde se guarda como PDF.
 * «Guardar como imagen» pide confirmación y descarga un PNG del resumen, sin los botones.
 */
export function ResumenFinal({ calculo, resumen, analisis }: PropsResumenFinal) {
  const { configuracion, precio } = calculo;
  const nombre = configuracion.nombre.trim() || "Tu producto";
  const [confirmandoImagen, setConfirmandoImagen] = useState(false);
  const [guardandoImagen, setGuardandoImagen] = useState(false);
  const [avisoImagen, setAvisoImagen] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  useEffect(() => {
    const limpiar = () => document.body.classList.remove(CLASE_IMPRIMIENDO, CLASE_CAPTURANDO);
    window.addEventListener("afterprint", limpiar);
    return () => {
      window.removeEventListener("afterprint", limpiar);
      limpiar();
    };
  }, []);

  function guardar() {
    document.body.classList.add(CLASE_IMPRIMIENDO);
    window.print();
  }

  async function guardarImagen() {
    setConfirmandoImagen(false);
    const nodo = document.getElementById("resumen-final");
    if (!nodo) return;
    setGuardandoImagen(true);
    setAvisoImagen(null);
    try {
      // Se carga recién al guardar: la librería no pesa en el resto del recorrido.
      const { toPng } = await import("html-to-image");
      // Los botones se ocultan un instante (no alcanza con filtrarlos: la librería conserva el alto que ocupaban).
      document.body.classList.add(CLASE_CAPTURANDO);
      await new Promise((listo) => requestAnimationFrame(listo));
      const url = await toPng(nodo, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        filter: (n) => !(n instanceof HTMLElement && n.hasAttribute("data-sin-imagen")),
      });
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = nombreArchivoResumen(configuracion.nombre);
      enlace.click();
      setAvisoImagen({ tipo: "ok", texto: "Listo: la imagen se guardó en tus descargas." });
    } catch {
      setAvisoImagen({ tipo: "error", texto: "No pudimos generar la imagen. Probá con «Guardar resumen (PDF)»." });
    } finally {
      document.body.classList.remove(CLASE_CAPTURANDO);
      setGuardandoImagen(false);
    }
  }

  const modoPrecio =
    precio.modo === "margen"
      ? `Calculado con un margen esperado de ${formatearPorcentaje(precio.margenPct)}`
      : "Precio ingresado por vos";
  const equilibrio = analisis.puntoEquilibrioUnidades
    ? `${formatearCantidad(analisis.puntoEquilibrioUnidades)} unidades`
    : "No existe: el precio no cubre el costo variable";

  return (
    <Tarjeta id="resumen-final" aria-labelledby="resumen-final-titulo" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary-600">Preciar · resumen del cálculo</p>
          <h2 id="resumen-final-titulo" className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
            {nombre}
          </h2>
          <p className="mt-1 text-sm text-gray-700">
            Los resultados y los supuestos con los que se hizo el cálculo, para que puedas revisarlo y guardarlo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden" data-sin-imagen>
          <Boton variante="secundario" onClick={guardar}>
            Guardar resumen (PDF)
          </Boton>
          <Boton variante="secundario" onClick={() => setConfirmandoImagen(true)} disabled={guardandoImagen}>
            {guardandoImagen ? "Guardando…" : "Guardar como imagen"}
          </Boton>
        </div>
      </div>
      <p
        role={avisoImagen?.tipo === "error" ? "alert" : "status"}
        className={`text-sm font-medium print:hidden ${avisoImagen?.tipo === "error" ? "text-danger-700" : "text-success-700"} ${avisoImagen ? "" : "sr-only"}`}
        data-sin-imagen
      >
        {avisoImagen ? `${avisoImagen.tipo === "error" ? "✕ " : "✓ "}${avisoImagen.texto}` : ""}
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Bloque titulo="Principales resultados">
          <Dato etiqueta="Costo unitario" valor={formatearMonto(resumen.costoUnitario)} />
          <Dato etiqueta="Precio de venta" valor={formatearMonto(analisis.precio)} />
          <Dato etiqueta="Margen resultante (sobre ventas)" valor={formatearPorcentaje(analisis.margenResultantePct)} />
          <Dato etiqueta="Contribución por unidad" valor={formatearMonto(analisis.contribucion)} />
          <Dato etiqueta="Punto de equilibrio" valor={equilibrio} />
          <Dato etiqueta="Facturación mínima" valor={formatearMonto(analisis.facturacionMinima)} />
          <Dato etiqueta="Ingresos del mes" valor={formatearMonto(analisis.ingresosTotalesMensual)} />
          <Dato etiqueta="Costos del mes" valor={formatearMonto(analisis.costosTotalesMensual)} />
          <Dato etiqueta="Ganancia del mes" valor={formatearMonto(analisis.gananciaNetaMensual)} destacado />
        </Bloque>

        <Bloque titulo="Supuestos usados">
          <Dato etiqueta="Modalidad" valor={OPCIONES_RUTA[configuracion.ruta].titulo} />
          <Dato etiqueta="Moneda" valor="Pesos argentinos (ARS)" />
          <Dato etiqueta="Período" valor="Mensual" />
          <Dato etiqueta="Unidad de venta" valor={configuracion.unidadVenta} />
          <Dato etiqueta="Volumen estimado" valor={`${formatearCantidad(resumen.volumenMensual)} por mes`} />
          <Dato etiqueta="Costos fijos del mes" valor={formatearMonto(resumen.costoFijoTotalMensual)} />
          <Dato etiqueta="Costos variables por unidad" valor={formatearMonto(resumen.costoVariableUnitario)} />
          <Dato etiqueta="Tu trabajo" valor={calculo.trabajoPropio.incluir ? `Incluido: ${formatearMonto(resumen.totalTrabajoPropioMensual)} por mes` : "No incluido en el costo"} />
          <Dato etiqueta="Precio" valor={modoPrecio} />
        </Bloque>
      </div>

      <div className="rounded-xl bg-primary-50 p-4 text-sm text-gray-700">
        <p className="font-semibold text-gray-900">Cómo se calcula</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Costo unitario = (costos fijos del mes + costo variable × unidades) ÷ unidades.</li>
          <li>Margen sobre ventas: precio sugerido = costo unitario ÷ (1 − margen).</li>
          <li>Punto de equilibrio = costos fijos ÷ (precio − costo variable), redondeado hacia arriba: no se vende media unidad.</li>
          <li>Los importes se redondean solo al mostrarlos; el cálculo usa los valores exactos.</li>
        </ul>
        <p className="mt-3 text-gray-700">
          Es una herramienta de apoyo para decidir precios: no reemplaza el asesoramiento contable o impositivo.
        </p>
      </div>

      <DialogoConfirmar
        abierto={confirmandoImagen}
        titulo="¿Guardar el resumen como imagen?"
        descripcion={`Se descarga un archivo PNG con los resultados y los supuestos de «${nombre}». No se pierde nada de lo que cargaste.`}
        etiquetaConfirmar="Sí, guardar imagen"
        varianteConfirmar="primario"
        onCancelar={() => setConfirmandoImagen(false)}
        onConfirmar={guardarImagen}
      />
    </Tarjeta>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">{titulo}</h3>
      <dl className="mt-2 divide-y divide-gray-200">{children}</dl>
    </section>
  );
}

function Dato({ etiqueta, valor, destacado = false }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-sm text-gray-700">{etiqueta}</dt>
      <dd className={`text-right text-sm ${destacado ? "font-extrabold text-primary-900" : "font-semibold text-gray-900"}`}>{valor}</dd>
    </div>
  );
}
