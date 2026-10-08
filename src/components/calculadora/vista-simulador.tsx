"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Aviso } from "@/components/ui/aviso";
import { Boton, BotonLink } from "@/components/ui/boton";
import { DialogoConfirmar } from "@/components/ui/dialogo-confirmar";
import { Tarjeta } from "@/components/ui/tarjeta";
import {
  metaDeVentas,
  simularEscenario,
  situacionBase,
  VARIACION_MAXIMA_PCT,
  VARIACION_MINIMA_PCT,
  type ResultadoEscenario,
  type TipoEscenario,
} from "@/domain/motor/escenarios";
import { useAnalisisPrecio } from "@/hooks/use-analisis-precio";
import { useHidratado } from "@/hooks/use-hidratado";
import { formatearCantidad, formatearMonto, formatearPorcentaje, formatearVariacion } from "@/lib/formato";
import { useCalculoStore } from "@/store/calculo-store";

interface DefinicionEscenario {
  tipo: TipoEscenario;
  icono: string;
  titulo: string;
  descripcion: string;
  etiquetaSlider: string;
  inicial: number;
}

const ESCENARIOS: DefinicionEscenario[] = [
  {
    tipo: "insumos",
    icono: "📉",
    titulo: "Suba de insumos",
    descripcion: "Simulá qué pasa si los materiales suben de precio.",
    etiquetaSlider: "Variación en costos variables",
    inicial: 20,
  },
  {
    tipo: "precio",
    icono: "💲",
    titulo: "Cambio de precio",
    descripcion: "Probá qué pasa si subís o bajás tu precio al público.",
    etiquetaSlider: "Variación en precio de venta",
    inicial: 15,
  },
  {
    tipo: "produccion",
    icono: "🏭",
    titulo: "Más producción",
    descripcion: "¿Qué pasa si producís y vendés más unidades al mes?",
    etiquetaSlider: "Variación en volumen de producción",
    inicial: 30,
  },
];

function Esqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando tu cálculo" className="flex animate-pulse flex-col gap-6">
      <div className="h-8 w-1/2 rounded-lg bg-gray-200" />
      <div className="h-28 rounded-2xl bg-gray-100" />
      <div className="h-80 rounded-2xl bg-gray-100" />
    </div>
  );
}

/** Paso 5 — «Simulador de escenarios» (Vista 5 del diseño). */
export function VistaSimulador() {
  const hidratado = useHidratado();
  return hidratado ? <Simulador /> : <Esqueleto />;
}

function Simulador() {
  const router = useRouter();
  const reiniciar = useCalculoStore((s) => s.reiniciar);
  const { calculo, precio, analisis } = useAnalisisPrecio();
  const [variaciones, setVariaciones] = useState<Record<TipoEscenario, number>>({
    insumos: ESCENARIOS[0].inicial,
    precio: ESCENARIOS[1].inicial,
    produccion: ESCENARIOS[2].inicial,
  });
  const [confirmandoReinicio, setConfirmandoReinicio] = useState(false);

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

  const meta = metaDeVentas(analisis?.puntoEquilibrioUnidades ?? null);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">¿Qué pasa si…?</h1>
        <p className="mt-2 text-lg text-gray-700">
          Movés los sliders y mirá cómo cambia tu negocio. No pasa nada real — solo jugamos con tus números.
        </p>
      </div>

      <section aria-labelledby="base" className="rounded-2xl bg-gray-900 p-6 text-white shadow-sm">
        <h2 id="base" className="text-sm text-gray-200">
          Situación actual (base)
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <DatoBase etiqueta="Costo unitario" valor={formatearMonto(base.costoUnitario)} />
          <DatoBase etiqueta="Precio de venta" valor={formatearMonto(base.precio)} />
          <DatoBase
            etiqueta="Punto de equilibrio"
            valor={base.puntoEquilibrio ? `${formatearCantidad(base.puntoEquilibrio)} uds` : "—"}
          />
          <DatoBase etiqueta="Ganancia mensual" valor={formatearMonto(base.gananciaMensual)} />
        </dl>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {ESCENARIOS.map((def) => (
          <TarjetaEscenario
            key={def.tipo}
            def={def}
            variacion={variaciones[def.tipo]}
            resultado={simularEscenario(calculo, precio, def.tipo, String(variaciones[def.tipo]))}
            onCambiar={(v) => setVariaciones((actual) => ({ ...actual, [def.tipo]: v }))}
          />
        ))}
      </div>

      <Aviso tono="consejo">
        El escenario de suba de insumos es el más importante. Los materiales siempre suben. ¿Tu negocio sigue siendo
        rentable con un {variaciones.insumos}% más de costo?
      </Aviso>

      <Tarjeta aria-labelledby="siguiente-paso" className="flex flex-col gap-4">
        <h2 id="siguiente-paso" className="text-base font-semibold text-gray-900">
          ¿Cuál es el siguiente paso?
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          <SiguientePaso icono="🎯" titulo="Fijar mi precio con confianza">
            Ya tenés todos los datos para salir al mercado con un precio fundamentado.
          </SiguientePaso>
          <SiguientePaso icono="📅" titulo="Establecer una meta de ventas mensual">
            {meta
              ? `Vendé al menos ${formatearCantidad(meta)} unidades/mes para tener ganancia real.`
              : "Vendé por encima de tu punto de equilibrio para tener ganancia real."}
          </SiguientePaso>
          <SiguientePaso icono="🔄" titulo="Revisar costos cada 3 meses">
            Los precios cambian. Actualizá este cálculo cuando cambien tus insumos o tus tarifas.
          </SiguientePaso>
        </ul>
      </Tarjeta>

      <div className="flex items-center justify-between gap-3">
        <BotonLink href="/calculadora/precio" variante="secundario">
          ← Atrás
        </BotonLink>
        <Boton onClick={() => setConfirmandoReinicio(true)}>Calcular otro producto</Boton>
      </div>

      <DialogoConfirmar
        abierto={confirmandoReinicio}
        titulo="¿Calcular otro producto?"
        descripcion="Vas a borrar lo que cargaste (producto, costos y precio) y volver al paso 1. Esta acción no se puede deshacer."
        etiquetaConfirmar="Sí, empezar de nuevo"
        onCancelar={() => setConfirmandoReinicio(false)}
        onConfirmar={() => {
          reiniciar();
          router.push("/calculadora/producto");
        }}
      />
    </div>
  );
}

function DatoBase({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-sm text-gray-200">{etiqueta}</dt>
      <dd className="mt-0.5 text-2xl font-extrabold">{valor}</dd>
    </div>
  );
}

function SiguientePaso({ icono, titulo, children }: { icono: string; titulo: string; children: ReactNode }) {
  return (
    <li className="rounded-xl bg-primary-50 p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
        <span aria-hidden="true">{icono}</span>
        {titulo}
      </h3>
      <p className="mt-2 text-sm text-gray-700">{children}</p>
    </li>
  );
}

function TarjetaEscenario({
  def,
  variacion,
  resultado,
  onCambiar,
}: {
  def: DefinicionEscenario;
  variacion: number;
  resultado: ResultadoEscenario | null;
  onCambiar: (valor: number) => void;
}) {
  const idSlider = `slider-${def.tipo}`;
  const signo = variacion > 0 ? "+" : "";

  return (
    <Tarjeta aria-labelledby={`titulo-${def.tipo}`} className="flex flex-col gap-4">
      <div>
        <h2 id={`titulo-${def.tipo}`} className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <span aria-hidden="true">{def.icono}</span>
          {def.titulo}
        </h2>
        <p className="mt-1 text-sm text-gray-500">{def.descripcion}</p>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <label htmlFor={idSlider} className="text-gray-700">
            {def.etiquetaSlider}
          </label>
          <output htmlFor={idSlider} className="font-semibold text-primary-600">
            {signo}
            {variacion}%
          </output>
        </div>
        <input
          id={idSlider}
          type="range"
          min={VARIACION_MINIMA_PCT}
          max={VARIACION_MAXIMA_PCT}
          step={1}
          value={variacion}
          aria-valuetext={`${signo}${variacion} por ciento`}
          onChange={(e) => onCambiar(Number(e.target.value))}
          className="mt-2 h-2 w-full cursor-pointer accent-primary-600"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500" aria-hidden="true">
          <span>{VARIACION_MINIMA_PCT}%</span>
          <span>+{VARIACION_MAXIMA_PCT}%</span>
        </div>
      </div>

      {resultado ? <Resultado resultado={resultado} /> : null}
    </Tarjeta>
  );
}

function Resultado({ resultado }: { resultado: ResultadoEscenario }) {
  const { variaciones } = resultado;
  return (
    <div aria-live="polite" className="flex flex-col gap-3">
      <dl className="grid grid-cols-2 gap-2">
        <Metrica etiqueta="Costo unitario" valor={formatearMonto(resultado.costoUnitario)} pct={variaciones.costoUnitarioPct} subirEsBueno={false} />
        <Metrica etiqueta="Precio de venta" valor={formatearMonto(resultado.precio)} pct={variaciones.precioPct} subirEsBueno />
        <Metrica
          etiqueta="BEP (uds)"
          valor={resultado.puntoEquilibrio ? `${formatearCantidad(resultado.puntoEquilibrio)} uds` : "—"}
          pct={variaciones.equilibrioPct}
          subirEsBueno={false}
        />
        <Metrica etiqueta="Ganancia mensual" valor={formatearMonto(resultado.gananciaMensual)} pct={variaciones.gananciaPct} subirEsBueno />
      </dl>
      <div className="flex items-center justify-between rounded-xl bg-primary-50 px-4 py-3">
        <span className="text-sm text-gray-700">Margen neto</span>
        <span className={`text-2xl font-extrabold ${Number(resultado.margenNetoPct) < 0 ? "text-danger-700" : "text-primary-600"}`}>
          {formatearPorcentaje(resultado.margenNetoPct)}
        </span>
      </div>
    </div>
  );
}

function Metrica({
  etiqueta,
  valor,
  pct,
  subirEsBueno,
}: {
  etiqueta: string;
  valor: string;
  pct: string | null;
  subirEsBueno: boolean;
}) {
  const cambio = pct === null ? 0 : Number(pct);
  const sinCambio = Math.abs(cambio) < 0.05;
  const bueno = subirEsBueno ? cambio > 0 : cambio < 0;
  const color = sinCambio ? "text-gray-500" : bueno ? "text-success-700" : "text-danger-700";
  const flecha = cambio < 0 ? "▼" : "▲";

  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <dt className="text-xs text-gray-500">{etiqueta}</dt>
      <dd className="mt-1 text-sm font-semibold text-gray-900">{valor}</dd>
      {pct === null ? null : (
        <dd className={`mt-0.5 text-xs font-medium ${color}`}>
          <span aria-hidden="true">{flecha} </span>
          {formatearVariacion(pct)}
          <span className="sr-only">
            {sinCambio ? " sin cambios" : bueno ? " mejora" : " empeora"} respecto de la situación actual
          </span>
        </dd>
      )}
    </div>
  );
}
