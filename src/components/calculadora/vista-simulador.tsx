"use client";

import { useRef, useState, type KeyboardEvent } from "react";

import { BotonGuardar } from "@/components/calculadora/boton-guardar";
import { ComparacionEscenarios, type EscenarioConResultado } from "@/components/calculadora/comparacion-escenarios";
import { ResumenFinal } from "@/components/calculadora/resumen-final";
import { Aviso } from "@/components/ui/aviso";
import { Boton, BotonLink } from "@/components/ui/boton";
import { IndicadorCambio } from "@/components/ui/indicador-cambio";
import { DialogoConfirmar } from "@/components/ui/dialogo-confirmar";
import { Tarjeta } from "@/components/ui/tarjeta";
import type { CambiosEscenario } from "@/domain/calculo";
import { compararConBase, type IndicadorId } from "@/domain/motor/comparacion";
import {
  simularVariaciones,
  situacionBase,
  VARIACION_MAXIMA_PCT,
  VARIACION_MINIMA_PCT,
  type ResultadoEscenario,
  type Situacion,
} from "@/domain/motor/escenarios";
import { MAX_ESCENARIOS, type EscenarioUsuario } from "@/domain/types";
import { useAnalisisPrecio } from "@/hooks/use-analisis-precio";
import { useHidratado } from "@/hooks/use-hidratado";
import { formatearCantidad, formatearMonto, formatearPorcentaje } from "@/lib/formato";
import { useCalculoStore } from "@/store/calculo-store";

function Esqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando tu cálculo" className="flex animate-pulse flex-col gap-6">
      <div className="h-8 w-1/2 rounded-lg bg-gray-200" />
      <div className="h-28 rounded-2xl bg-gray-100" />
      <div className="h-80 rounded-2xl bg-gray-100" />
    </div>
  );
}

/** Un campo vacío cuenta como «sin cambio» al simular. */
const comoPct = (valor: string) => (valor.trim() === "" ? "0" : valor);

/** Deja el valor escrito dentro del rango permitido. Vacío o inválido pasa a «0». */
function limitarPct(valor: string): string {
  const n = Number(valor);
  if (valor.trim() === "" || Number.isNaN(n)) return "0";
  return String(Math.min(Math.max(n, VARIACION_MINIMA_PCT), VARIACION_MAXIMA_PCT));
}

/** Paso 5 — «Simulador de escenarios» (Vista 5 del diseño). */
export function VistaSimulador() {
  const hidratado = useHidratado();
  return hidratado ? <Simulador /> : <Esqueleto />;
}

function Simulador() {
  const agregarEscenario = useCalculoStore((s) => s.agregarEscenario);
  const duplicarEscenario = useCalculoStore((s) => s.duplicarEscenario);
  const actualizarEscenario = useCalculoStore((s) => s.actualizarEscenario);
  const eliminarEscenario = useCalculoStore((s) => s.eliminarEscenario);
  const { calculo, resumen, precio, analisis } = useAnalisisPrecio();
  const [idAEliminar, setIdAEliminar] = useState<string | null>(null);
  const [idActivo, setIdActivo] = useState<string | null>(null);

  const base = precio ? situacionBase(calculo, precio) : null;

  if (!precio || !base) {
    return (
      <div className="flex flex-col items-start gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Primero elegí tu precio</h1>
        <Aviso tono="advertencia">Para simular escenarios necesitamos tus costos y el precio al que vas a vender.</Aviso>
        <BotonLink href="/calculadora/precio">Ir al precio</BotonLink>
      </div>
    );
  }

  const escenarios = calculo.escenarios;
  const resultados = new Map(
    escenarios.map((e) => [
      e.id,
      simularVariaciones(calculo, precio, {
        insumosPct: comoPct(e.insumosPct),
        precioPct: comoPct(e.precioPct),
        produccionPct: comoPct(e.produccionPct),
      }),
    ]),
  );
  const paraComparar: EscenarioConResultado[] = escenarios.flatMap((escenario) => {
    const resultado = resultados.get(escenario.id);
    return resultado ? [{ escenario, resultado }] : [];
  });
  const llegoAlMaximo = escenarios.length >= MAX_ESCENARIOS;
  const escenarioAEliminar = escenarios.find((e) => e.id === idAEliminar) ?? null;
  // Se muestra un escenario a la vez: el elegido, o el primero si el elegido ya no existe (por ejemplo, se eliminó).
  const escenarioActivo = escenarios.find((e) => e.id === idActivo) ?? escenarios[0] ?? null;

  /** Ejecuta la acción (agregar o duplicar) y pasa a la pestaña del escenario que quedó nuevo. */
  function conNuevoActivo(accion: () => void) {
    const antes = new Set(useCalculoStore.getState().calculo.escenarios.map((e) => e.id));
    accion();
    const nuevo = useCalculoStore.getState().calculo.escenarios.find((e) => !antes.has(e.id));
    if (nuevo) setIdActivo(nuevo.id);
  }
  const producto = calculo.configuracion.nombre.trim();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-primary-600">Paso 5 de 5</p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">¿Qué pasa si…?</h1>
        <p className="mt-2 text-lg text-gray-700">Elegí un escenario y movelo para ver cómo cambian tus números.</p>
      </div>

      <section aria-labelledby="base" className="rounded-2xl bg-primary-900 p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="base" className="text-xs font-bold uppercase tracking-widest text-gray-300">
            Situación actual (base)
          </h2>
          {producto ? <p className="text-sm font-semibold">{producto}</p> : null}
        </div>
        {/* Figma: cinco datos, con el margen neto entre el precio y el punto de equilibrio. */}
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-5">
          <DatoBase etiqueta="Costo unitario" valor={formatearMonto(base.costoUnitario)} />
          <DatoBase etiqueta="Precio de venta" valor={formatearMonto(base.precio)} />
          <DatoBase etiqueta="Margen neto" valor={formatearPorcentaje(base.margenNetoPct)} />
          <DatoBase
            etiqueta="Punto de equilibrio"
            valor={base.puntoEquilibrio ? `${formatearCantidad(base.puntoEquilibrio)} uds` : "—"}
          />
          <DatoBase etiqueta="Ganancia mensual" valor={formatearMonto(base.gananciaMensual)} />
        </dl>
      </section>

      {escenarioActivo === null ? (
        <>
          <Aviso tono="consejo">No tenés escenarios. Agregá uno para empezar a comparar.</Aviso>
          <BotonAgregar llegoAlMaximo={llegoAlMaximo} onAgregar={() => conNuevoActivo(agregarEscenario)} />
        </>
      ) : (
        <section aria-label="Simulador de escenarios" className="flex flex-col gap-4">
          {/* Figma: primero el escenario elegido y, debajo, «Generar otro escenario» con la lista para cambiar de escenario. */}
          <div role="tabpanel" id={`panel-${escenarioActivo.id}`} aria-labelledby={`pestana-${escenarioActivo.id}`}>
            <TarjetaEscenario
              key={escenarioActivo.id}
              escenario={escenarioActivo}
              base={base}
              resultado={resultados.get(escenarioActivo.id) ?? null}
              puedeDuplicar={!llegoAlMaximo}
              onCambiar={(cambios) => actualizarEscenario(escenarioActivo.id, cambios)}
              onDuplicar={() => conNuevoActivo(() => duplicarEscenario(escenarioActivo.id))}
              onEliminar={() => setIdAEliminar(escenarioActivo.id)}
            />
          </div>
          <h2 id="escenarios" className="mt-2 text-base font-semibold text-gray-900">
            Generar otro escenario
          </h2>
          <PestanasEscenarios
            escenarios={escenarios}
            idActivo={escenarioActivo.id}
            onElegir={setIdActivo}
            onAgregar={() => conNuevoActivo(agregarEscenario)}
            llegoAlMaximo={llegoAlMaximo}
          />
          {llegoAlMaximo ? (
            <p className="text-sm text-gray-700">Llegaste al máximo de {MAX_ESCENARIOS} escenarios.</p>
          ) : null}
        </section>
      )}

      {/* Figma: la comparación con la situación actual queda siempre a la vista (antes estaba en un desplegable). */}
      {/*
        `relative overflow-x-clip`: la tabla tiene textos solo para lectores de pantalla (sr-only, posición absoluta) que,
        en celular, quedaban fuera del recuadro con scroll y estiraban la página a lo ancho. Así quedan contenidos.
      */}
      {paraComparar.length > 0 ? (
        <div className="relative overflow-x-clip">
          <ComparacionEscenarios base={base} escenarios={paraComparar} />
        </div>
      ) : null}

      {/*
        Resumen final (lo armó xandcari): ya no se ve en la pantalla, porque en Figma se descarga desde el panel
        («Guardar resumen» / «Guardar como imagen»). Queda montado fuera de la vista para imprimirlo o capturarlo;
        al imprimir, `globals.css` lo muestra solo a él. `inert` evita que el teclado o el lector de pantalla lo recorran.
      */}
      {analisis ? (
        <div inert className="pointer-events-none fixed top-0 -left-[10000px] w-[56rem] print:static print:w-auto">
          <ResumenFinal calculo={calculo} resumen={resumen} analisis={analisis} />
        </div>
      ) : null}

      {/* En Figma solo queda «Atrás»: para empezar otro cálculo está «Reiniciar» arriba. */}
      <div>
        <BotonLink href="/calculadora/precio" variante="secundario">
          Atrás
        </BotonLink>
      </div>

      <BotonGuardar />

      <DialogoConfirmar
        abierto={escenarioAEliminar !== null}
        titulo="¿Eliminar este escenario?"
        descripcion={
          escenarioAEliminar ? `Vas a eliminar «${escenarioAEliminar.nombre}». Esta acción no se puede deshacer.` : ""
        }
        etiquetaConfirmar="Sí, eliminar"
        onCancelar={() => setIdAEliminar(null)}
        onConfirmar={() => {
          if (idAEliminar) eliminarEscenario(idAEliminar);
          setIdAEliminar(null);
        }}
      />
    </div>
  );
}

function BotonAgregar({ llegoAlMaximo, onAgregar }: { llegoAlMaximo: boolean; onAgregar: () => void }) {
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onAgregar}
        disabled={llegoAlMaximo}
        className="min-h-11 w-full rounded-xl border border-dashed border-gray-400 bg-transparent px-5 py-3 text-sm font-medium text-gray-900 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Agregar escenario
      </button>
      {llegoAlMaximo ? <p className="text-sm text-gray-700">Llegaste al máximo de {MAX_ESCENARIOS} escenarios.</p> : null}
    </div>
  );
}

/** Pestañas (una por escenario). Flechas ← → mueven entre ellas, como en un tablist estándar. */
function PestanasEscenarios({
  escenarios,
  idActivo,
  onElegir,
  onAgregar,
  llegoAlMaximo,
}: {
  escenarios: EscenarioUsuario[];
  idActivo: string;
  onElegir: (id: string) => void;
  onAgregar: () => void;
  llegoAlMaximo: boolean;
}) {
  const lista = useRef<HTMLDivElement>(null);

  function alTeclear(e: KeyboardEvent<HTMLDivElement>) {
    const indice = escenarios.findIndex((x) => x.id === idActivo);
    let destino = indice;
    if (e.key === "ArrowRight") destino = (indice + 1) % escenarios.length;
    else if (e.key === "ArrowLeft") destino = (indice - 1 + escenarios.length) % escenarios.length;
    else if (e.key === "Home") destino = 0;
    else if (e.key === "End") destino = escenarios.length - 1;
    else return;
    e.preventDefault();
    onElegir(escenarios[destino].id);
    lista.current?.querySelector<HTMLElement>(`[id="pestana-${escenarios[destino].id}"]`)?.focus();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div ref={lista} role="tablist" aria-label="Escenarios" onKeyDown={alTeclear} className="flex flex-wrap gap-2">
        {escenarios.map((e) => {
          const activa = e.id === idActivo;
          return (
            <button
              key={e.id}
              id={`pestana-${e.id}`}
              type="button"
              role="tab"
              aria-selected={activa}
              aria-controls={`panel-${e.id}`}
              tabIndex={activa ? 0 : -1}
              onClick={() => onElegir(e.id)}
              // Figma: la elegida va celeste con ✓; las demás, blancas con borde. Forma de píldora.
              className={`inline-flex min-h-11 max-w-56 items-center gap-1.5 rounded-full border px-4 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 ${
                activa
                  ? "border-primary-600 bg-primary-100 font-semibold text-gray-900"
                  : "border-gray-400 bg-white text-gray-900 hover:bg-gray-50"
              }`}
            >
              {activa ? <span aria-hidden="true">✓</span> : null}
              <span className="truncate">{e.nombre.trim() || "Sin nombre"}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onAgregar}
        disabled={llegoAlMaximo}
        className="min-h-11 rounded-full border border-dashed border-gray-400 bg-transparent px-4 py-2 text-sm font-medium text-gray-900 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Nuevo escenario
      </button>
    </div>
  );
}

function DatoBase({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      {/* 12 px desde tablet, como en el Figma, para que las cinco etiquetas entren en una línea. */}
      <dt className="text-sm text-gray-200 sm:text-xs">{etiqueta}</dt>
      <dd className="mt-0.5 text-2xl font-extrabold">{valor}</dd>
    </div>
  );
}

const trazo = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function TarjetaEscenario({
  escenario,
  base,
  resultado,
  puedeDuplicar,
  onCambiar,
  onDuplicar,
  onEliminar,
}: {
  escenario: EscenarioUsuario;
  base: Situacion;
  resultado: ResultadoEscenario | null;
  puedeDuplicar: boolean;
  onCambiar: (cambios: CambiosEscenario) => void;
  onDuplicar: () => void;
  onEliminar: () => void;
}) {
  const idNombre = `nombre-${escenario.id}`;

  return (
    <Tarjeta aria-labelledby={idNombre} className="flex flex-col gap-6">
      {/* Figma: ícono + nombre del escenario + «Duplicar» y «Eliminar» en la misma fila, arriba. */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-gray-900">
          <svg {...trazo}>
            <path d="m3 17 6-6 4 4 8-8" />
            <path d="M15 7h6v6" />
          </svg>
        </span>
        <label htmlFor={idNombre} className="sr-only">
          Nombre del escenario
        </label>
        <input
          id={idNombre}
          type="text"
          value={escenario.nombre}
          maxLength={40}
          onChange={(e) => onCambiar({ nombre: e.target.value })}
          // min-w-40: en pantallas angostas el nombre no se achica; los botones bajan a la línea de abajo.
          className="min-h-11 min-w-40 flex-1 rounded-lg border border-gray-400 px-3 py-2 text-xl font-semibold text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        />
        <div className="flex gap-2">
          <Boton variante="secundario" onClick={onDuplicar} disabled={!puedeDuplicar} className="text-gray-900">
            Duplicar<span className="sr-only"> {escenario.nombre}</span>
          </Boton>
          <Boton variante="secundario" onClick={onEliminar} className="border-gray-200 bg-gray-100 text-gray-700">
            Eliminar<span className="sr-only"> {escenario.nombre}</span>
          </Boton>
        </div>
      </div>

      {/* Figma: barras a la izquierda; costo unitario y precio de venta a la derecha. En celular queda una columna. */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_17.5rem]">
        <div className="flex flex-col gap-4">
          <ControlVariacion
            id={`insumos-${escenario.id}`}
            etiqueta="Variación en costos variables"
            valor={escenario.insumosPct}
            onCambiar={(v) => onCambiar({ insumosPct: v })}
          />
          <ControlVariacion
            id={`precio-${escenario.id}`}
            etiqueta="Variación en precio de venta"
            valor={escenario.precioPct}
            onCambiar={(v) => onCambiar({ precioPct: v })}
          />
          <ControlVariacion
            id={`produccion-${escenario.id}`}
            etiqueta="Variación en volumen de producción"
            valor={escenario.produccionPct}
            onCambiar={(v) => onCambiar({ produccionPct: v })}
          />
        </div>
        {resultado ? <MetricasLaterales base={base} resultado={resultado} /> : null}
      </div>

      {resultado ? <MetricasInferiores base={base} resultado={resultado} /> : null}
    </Tarjeta>
  );
}

function ControlVariacion({
  id,
  etiqueta,
  valor,
  onCambiar,
}: {
  id: string;
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
}) {
  const numero = Number(valor) || 0;
  const signo = numero > 0 ? "+" : "";

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <label htmlFor={id} className="text-gray-700">
          {etiqueta}
        </label>
        {/* Se puede escribir el porcentaje exacto o mover la barra; al salir del campo se ajusta al rango permitido. */}
        <div className="flex items-center gap-1">
          <input
            type="number"
            inputMode="decimal"
            aria-label={`${etiqueta}, valor exacto en porcentaje`}
            min={VARIACION_MINIMA_PCT}
            max={VARIACION_MAXIMA_PCT}
            step={1}
            value={valor}
            onChange={(e) => onCambiar(e.target.value)}
            onBlur={() => {
              const limpio = limitarPct(valor);
              if (limpio !== valor) onCambiar(limpio);
            }}
            className="w-20 rounded-lg border border-gray-500 px-2 py-1 text-right font-semibold text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          />
          <span aria-hidden="true" className="font-semibold text-gray-900">
            %
          </span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={VARIACION_MINIMA_PCT}
        max={VARIACION_MAXIMA_PCT}
        step={1}
        value={numero}
        aria-valuetext={`${signo}${numero} por ciento`}
        onChange={(e) => onCambiar(e.target.value)}
        className="mt-1 h-6 w-full cursor-pointer accent-primary-600"
      />
      <div className="mt-1 flex justify-between text-xs text-gray-500" aria-hidden="true">
        <span>{VARIACION_MINIMA_PCT}%</span>
        <span>0%</span>
        <span>+{VARIACION_MAXIMA_PCT}%</span>
      </div>
    </div>
  );
}

type Metrica = {
  id: IndicadorId;
  etiqueta: string;
  /** Frase corta del Figma que explica qué es el dato. */
  descripcion: string;
  unidad: "monto" | "unidades" | "puntos";
  valor: (r: ResultadoEscenario) => string;
};

/** Las cinco métricas de cada escenario, con los textos del Figma. */
const METRICAS: Record<IndicadorId, Metrica> = {
  costoUnitario: {
    id: "costoUnitario",
    etiqueta: "Costo unitario",
    descripcion: "Lo que te cuesta hacer una unidad.",
    unidad: "monto",
    valor: (r) => formatearMonto(r.costoUnitario),
  },
  precio: {
    id: "precio",
    etiqueta: "Precio de venta",
    descripcion: "A lo que vendés cada unidad.",
    unidad: "monto",
    valor: (r) => formatearMonto(r.precio),
  },
  margenNeto: {
    id: "margenNeto",
    etiqueta: "Margen neto",
    descripcion: "Parte del precio que te queda como ganancia.",
    unidad: "puntos",
    valor: (r) => formatearPorcentaje(r.margenNetoPct),
  },
  gananciaMensual: {
    id: "gananciaMensual",
    etiqueta: "Ganancia mensual",
    descripcion: "Lo que te queda al mes después de todos los costos.",
    unidad: "monto",
    valor: (r) => formatearMonto(r.gananciaMensual),
  },
  puntoEquilibrio: {
    id: "puntoEquilibrio",
    etiqueta: "Punto de equilibrio",
    descripcion: "Unidades que tenés que vender para no perder plata.",
    unidad: "unidades",
    valor: (r) => (r.puntoEquilibrio ? `${formatearCantidad(r.puntoEquilibrio)} uds` : "—"),
  },
};

/** Una tarjeta de métrica: nombre, valor, cambio contra la base y la frase que la explica. */
function TarjetaMetrica({
  metrica,
  resultado,
  comparacion,
  destacada = false,
}: {
  metrica: Metrica;
  resultado: ResultadoEscenario;
  comparacion: ReturnType<typeof compararConBase>;
  destacada?: boolean;
}) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl p-4 ${destacada ? "bg-primary-50" : "bg-gray-100"}`}>
      <dt className="text-xs font-semibold text-gray-900">{metrica.etiqueta}</dt>
      <dd className="text-2xl font-bold text-gray-900">{metrica.valor(resultado)}</dd>
      <dd>
        <IndicadorCambio cambio={comparacion[metrica.id]} unidad={metrica.unidad} nombre={metrica.etiqueta} />
      </dd>
      <dd className="mt-1 text-xs text-gray-700">{metrica.descripcion}</dd>
    </div>
  );
}

/** Columna derecha del editor: costo unitario y precio de venta. */
function MetricasLaterales({ base, resultado }: { base: Situacion; resultado: ResultadoEscenario }) {
  // La misma comparación que usa la tabla (motor): la tarjeta y la tabla nunca dicen cosas distintas.
  const comparacion = compararConBase(base, resultado);
  return (
    <dl aria-live="polite" className="flex flex-col gap-3">
      <TarjetaMetrica metrica={METRICAS.costoUnitario} resultado={resultado} comparacion={comparacion} />
      <TarjetaMetrica metrica={METRICAS.precio} resultado={resultado} comparacion={comparacion} />
    </dl>
  );
}

/** Fila de abajo del editor: margen neto, ganancia mensual (destacada) y punto de equilibrio. */
function MetricasInferiores({ base, resultado }: { base: Situacion; resultado: ResultadoEscenario }) {
  const comparacion = compararConBase(base, resultado);
  return (
    <dl aria-live="polite" className="grid gap-3 sm:grid-cols-3">
      <TarjetaMetrica metrica={METRICAS.margenNeto} resultado={resultado} comparacion={comparacion} />
      <TarjetaMetrica metrica={METRICAS.gananciaMensual} resultado={resultado} comparacion={comparacion} destacada />
      <TarjetaMetrica metrica={METRICAS.puntoEquilibrio} resultado={resultado} comparacion={comparacion} />
    </dl>
  );
}
