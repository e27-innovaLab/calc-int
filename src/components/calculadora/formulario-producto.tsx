"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";

import { Ayuda } from "@/components/ui/ayuda";
import { Aviso } from "@/components/ui/aviso";
import { Boton } from "@/components/ui/boton";
import { Campo, clasesCampo } from "@/components/ui/campo";
import { CampoMonto } from "@/components/ui/campo-monto";
import { Tarjeta } from "@/components/ui/tarjeta";
import { configuracionSchema, type ConfiguracionFormulario } from "@/domain/validaciones";
import { useHidratado } from "@/hooks/use-hidratado";
import { formatearCantidad } from "@/lib/formato";
import { useCalculoStore } from "@/store/calculo-store";

const UNIDADES_DE_VENTA = [
  { valor: "unidad", etiqueta: "unidades" },
  { valor: "kg", etiqueta: "kg" },
  { valor: "litro", etiqueta: "litros" },
  { valor: "docena", etiqueta: "docenas" },
  { valor: "par", etiqueta: "pares" },
  { valor: "metro", etiqueta: "metros" },
  { valor: "pack", etiqueta: "packs" },
];

const PERIODOS = [
  { valor: "semanal", etiqueta: "Semanal", disponible: false },
  { valor: "quincenal", etiqueta: "Quincenal", disponible: false },
  { valor: "mensual", etiqueta: "Mensual", disponible: true },
];

function Esqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando tu cálculo" className="flex animate-pulse flex-col gap-6">
      <div className="h-8 w-2/3 rounded-lg bg-gray-200" />
      <div className="h-96 rounded-2xl bg-gray-100" />
    </div>
  );
}

/** Paso 1 — «Tu producto» (Vista 1 del diseño). */
export function FormularioProducto() {
  const hidratado = useHidratado();
  return hidratado ? <Formulario /> : <Esqueleto />;
}

function Formulario() {
  const router = useRouter();
  const configuracion = useCalculoStore((s) => s.calculo.configuracion);
  const actualizarConfiguracion = useCalculoStore((s) => s.actualizarConfiguracion);
  const cambiarPaso = useCalculoStore((s) => s.cambiarPaso);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfiguracionFormulario>({
    resolver: zodResolver(configuracionSchema),
    mode: "onTouched",
    defaultValues: {
      nombre: configuracion.nombre,
      unidadVenta: configuracion.unidadVenta,
      unidadesPorLote: configuracion.unidadesPorLote,
      lotes: configuracion.lotes,
    },
  });

  const volumenListo = configuracion.volumenMensual !== "";
  const unidades = UNIDADES_DE_VENTA.find((u) => u.valor === configuracion.unidadVenta)?.etiqueta ?? configuracion.unidadVenta;

  const continuar = handleSubmit(() => {
    cambiarPaso("costos");
    router.push("/calculadora/costos");
  });

  return (
    <form onSubmit={continuar} noValidate className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Contame sobre tu producto</h1>
        <p className="mt-2 text-lg text-gray-700">
          Empezamos con lo básico. Esto personaliza todos los cálculos para tu negocio real.
        </p>
      </div>

      <Tarjeta className="flex flex-col gap-6">
        <Campo
          idControl="nombre"
          etiqueta={
            <>
              Nombre del producto <span aria-hidden="true" className="text-danger-700">*</span>
              <span className="sr-only"> (obligatorio)</span>
            </>
          }
          error={errors.nombre?.message}
          idError="nombre-error"
        >
          <input
            id="nombre"
            type="text"
            autoComplete="off"
            placeholder="Ej: Torta de chocolate, Vela aromática, Remera estampada…"
            aria-invalid={errors.nombre ? true : undefined}
            aria-describedby={errors.nombre ? "nombre-error" : undefined}
            className={clasesCampo(Boolean(errors.nombre))}
            {...register("nombre", { onChange: (e) => actualizarConfiguracion({ nombre: e.target.value }) })}
          />
        </Campo>

        <div className="grid gap-6 sm:grid-cols-2">
          <Campo idControl="moneda" etiqueta="Moneda" descripcion="Por ahora calculamos solo en pesos argentinos.">
            <select id="moneda" disabled className={`${clasesCampo(false)} bg-gray-50`} defaultValue="ARS">
              <option value="ARS">$ (Peso AR)</option>
            </select>
          </Campo>

          <Campo idControl="unidad-venta" etiqueta="Unidad de venta" error={errors.unidadVenta?.message} idError="unidad-venta-error">
            <select
              id="unidad-venta"
              aria-invalid={errors.unidadVenta ? true : undefined}
              aria-describedby={errors.unidadVenta ? "unidad-venta-error" : undefined}
              className={clasesCampo(Boolean(errors.unidadVenta))}
              {...register("unidadVenta", { onChange: (e) => actualizarConfiguracion({ unidadVenta: e.target.value }) })}
            >
              {UNIDADES_DE_VENTA.map((u) => (
                <option key={u.valor} value={u.valor}>
                  {u.etiqueta}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-base font-medium text-gray-900">Período de referencia</legend>
          <div role="radiogroup" aria-label="Período de referencia" className="grid grid-cols-3 gap-3">
            {PERIODOS.map((p) => (
              <div key={p.valor} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  role="radio"
                  aria-checked={p.disponible}
                  disabled={!p.disponible}
                  className={`w-full rounded-xl border px-4 py-3 text-base font-medium ${
                    p.disponible
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  {p.etiqueta}
                </button>
                {p.disponible ? null : <span className="text-xs text-gray-500">Próximamente</span>}
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-500">Los costos se calculan por mes.</p>
        </fieldset>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-medium text-gray-900">¿Cuánto pensás producir este mes?</h2>
            <Ayuda
              sobre="cuánto producís por mes"
              texto="Usaremos este dato para repartir los costos fijos entre todas tus unidades."
              ejemplo="si vendés 100 remeras al mes, poné 100 acá. Si no sabés, poné tu estimación más realista."
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Campo
              idControl="unidades-por-lote"
              etiqueta="Unidades por lote"
              error={errors.unidadesPorLote?.message}
              idError="unidades-por-lote-error"
            >
              <Controller
                control={control}
                name="unidadesPorLote"
                render={({ field }) => (
                  <CampoMonto
                    id="unidades-por-lote"
                    ref={field.ref}
                    prefijo={null}
                    placeholder="Ej: 20"
                    value={field.value}
                    invalido={Boolean(errors.unidadesPorLote)}
                    idError="unidades-por-lote-error"
                    onBlur={field.onBlur}
                    onChange={(valor) => {
                      field.onChange(valor);
                      actualizarConfiguracion({ unidadesPorLote: valor });
                    }}
                  />
                )}
              />
            </Campo>

            <Campo
              idControl="lotes"
              etiqueta="Lotes por mes"
              error={errors.lotes?.message}
              idError="lotes-error"
            >
              <Controller
                control={control}
                name="lotes"
                render={({ field }) => (
                  <CampoMonto
                    id="lotes"
                    ref={field.ref}
                    prefijo={null}
                    placeholder="Ej: 6"
                    value={field.value}
                    invalido={Boolean(errors.lotes)}
                    idError="lotes-error"
                    onBlur={field.onBlur}
                    onChange={(valor) => {
                      field.onChange(valor);
                      actualizarConfiguracion({ lotes: valor });
                    }}
                  />
                )}
              />
            </Campo>
          </div>

          <div aria-live="polite" className="min-h-12">
            {volumenListo ? (
              <p className="flex items-center gap-2 rounded-xl bg-success-50 px-4 py-3 text-sm text-success-700">
                <span aria-hidden="true">✓</span>
                <span>
                  Producís <strong>{formatearCantidad(configuracion.volumenMensual)} {unidades}</strong> por mes (
                  {formatearCantidad(configuracion.unidadesPorLote)} × {formatearCantidad(configuracion.lotes)} lotes)
                </span>
              </p>
            ) : null}
          </div>
        </div>
      </Tarjeta>

      <Aviso tono="info" titulo="¿Por qué necesitamos esto?">
        Para saber cuánto le cuesta a tu negocio fabricar cada unidad, dividimos todos los costos fijos entre las
        unidades que producís al mes.
      </Aviso>

      <Aviso tono="consejo">
        El 70% de los emprendedores fijan precios sin calcular su costo real. Vos ya estás haciendo las cosas bien.
      </Aviso>

      <div className="flex justify-end">
        <Boton type="submit">Continuar →</Boton>
      </div>
    </form>
  );
}
