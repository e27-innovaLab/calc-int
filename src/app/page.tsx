import type { ReactNode } from "react";

import { Cabecera, Pie } from "@/components/calculadora/cabecera";
import { BotonLink } from "@/components/ui/boton";

/** Íconos de línea (estilo del diseño de Figma). Son decorativos: el texto de al lado ya dice lo mismo. */
function Icono({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      {children}
    </svg>
  );
}

const ICONOS = {
  barras: (
    <Icono>
      <path d="M4 20h16" />
      <path d="M7 16v-5" />
      <path d="M12 16V6" />
      <path d="M17 16v-8" />
    </Icono>
  ),
  reloj: (
    <Icono>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </Icono>
  ),
  objetivo: (
    <Icono>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </Icono>
  ),
  etiqueta: (
    <Icono>
      <path d="M3 12V4h8l9 9-8 8z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </Icono>
  ),
  billete: (
    <Icono>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </Icono>
  ),
  lista: (
    <Icono>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </Icono>
  ),
  tendencia: (
    <Icono>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </Icono>
  ),
};

const DESCUIDOS = [
  {
    icono: ICONOS.barras,
    titulo: "No sabés el costo real por unidad",
    texto: "Calculás de memoria y terminás vendiendo más barato de lo que te cuesta producir.",
  },
  {
    icono: ICONOS.reloj,
    titulo: "Te olvidaste de costear tu tiempo",
    texto: "Tu trabajo tiene valor. Si no te lo pagás, estás subsidiando a tus clientes sin saberlo.",
  },
  {
    icono: ICONOS.objetivo,
    titulo: "No conocés tu punto de equilibrio",
    texto: "No sabés cuánto tenés que vender para no perder. Planificar se vuelve difícil.",
  },
];

const PASOS = [
  { icono: ICONOS.etiqueta, titulo: "Tu producto", texto: "Ruta y volumen" },
  { icono: ICONOS.billete, titulo: "Costos", texto: "Fijos y variables" },
  { icono: ICONOS.lista, titulo: "Resumen", texto: "Tu costo real" },
  { icono: ICONOS.objetivo, titulo: "Precio", texto: "Margen y equilibrio" },
  { icono: ICONOS.tendencia, titulo: "Simulación", texto: "Probá escenarios" },
];

/** Etiqueta chica en mayúsculas que va arriba de cada título de sección. */
function Antetitulo({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-primary-600">{children}</p>;
}

export default function Home() {
  return (
    <>
      <Cabecera derecha={<span className="hidden sm:inline">Costos y precios claros</span>} />
      <main id="contenido" className="flex flex-1 flex-col">
        {/* Hero: bloque marino con degradé hacia azul, como en Figma. */}
        <section
          aria-labelledby="titulo-portada"
          className="relative overflow-hidden bg-primary-900 bg-[radial-gradient(ellipse_at_85%_15%,#58b4f0_0%,transparent_45%),linear-gradient(110deg,#101b3b_25%,#2b499f_100%)]"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:px-6 sm:py-24">
            <p className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white">
              Gratis · Sin registro · Privado
            </p>
            <h1 id="titulo-portada" className="max-w-lg text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Calculá el precio real de tu producto
            </h1>
            <p className="max-w-xl text-lg text-white/85">
              Ordená tus costos, valorá tu tiempo y encontrá un precio que sostenga tu negocio. Con tus números y sin
              vueltas.
            </p>
            <BotonLink
              href="/calculadora/producto"
              variante="celeste"
              className="px-8 py-4 text-base"
            >
              Empezar mi cálculo
            </BotonLink>
            <p className="text-sm text-white/75">5 pasos · Menos de 10 minutos</p>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6">
          <section aria-labelledby="descuidos" className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Antetitulo>Una cuenta incompleta cuesta caro</Antetitulo>
              <h2 id="descuidos" className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Tres descuidos que pueden hacerte perder plata
              </h2>
            </div>
            <ul className="grid w-full gap-4 sm:grid-cols-3">
              {DESCUIDOS.map((d) => (
                <li key={d.titulo} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-accent-400 text-primary-900">
                    {d.icono}
                  </span>
                  <h3 className="font-semibold text-gray-900">{d.titulo}</h3>
                  <p className="text-sm text-gray-700">{d.texto}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="como-funciona" className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Antetitulo>Cómo funciona</Antetitulo>
              <h2 id="como-funciona" className="text-2xl font-bold text-gray-900 sm:text-3xl">
                De tus costos a una decisión clara
              </h2>
            </div>
            <ol className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {PASOS.map((p, i) => (
                <li key={p.titulo} className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                  <span
                    aria-hidden="true"
                    className="flex size-7 items-center justify-center rounded-full bg-accent-400 text-xs font-bold text-primary-900"
                  >
                    {i + 1}
                  </span>
                  <span className="mt-1 text-primary-600">{p.icono}</span>
                  <h3 className="font-semibold text-gray-900">
                    <span className="sr-only">Paso {i + 1}: </span>
                    {p.titulo}
                  </h3>
                  <p className="text-sm text-gray-700">{p.texto}</p>
                </li>
              ))}
            </ol>
            <div className="flex justify-center pt-2">
              <BotonLink href="/calculadora/producto" variante="secundario" className="px-8">
                Empezar mi cálculo
              </BotonLink>
            </div>
          </section>
        </div>
      </main>
      <Pie />
    </>
  );
}
