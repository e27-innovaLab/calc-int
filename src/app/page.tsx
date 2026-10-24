import { Cabecera, Pie } from "@/components/calculadora/cabecera";
import { BotonLink } from "@/components/ui/boton";

const ERRORES = [
  {
    icono: "📊",
    titulo: "No sabés el costo real por unidad",
    texto: "Calculás de memoria y terminás vendiendo más barato de lo que te cuesta producir.",
  },
  {
    icono: "⏰",
    titulo: "Te olvidaste de costear tu tiempo",
    texto: "Tu trabajo tiene valor. Si no te lo pagás, estás subsidiando a tus clientes sin saberlo.",
  },
  {
    icono: "📉",
    titulo: "No conocés tu punto de equilibrio",
    texto: "No sabés cuánto tenés que vender para no perder. Planificar se vuelve imposible.",
  },
];

const PASOS = [
  { icono: "🏷️", titulo: "Tu Producto", texto: "Nombre, moneda y volumen" },
  { icono: "💵", titulo: "Costos", texto: "Fijos, variables y tu tiempo" },
  { icono: "📋", titulo: "Resumen", texto: "Costo unitario real" },
  { icono: "💰", titulo: "Precio", texto: "Margen y punto de equilibrio" },
  { icono: "🔮", titulo: "Simulador", texto: "Escenarios y proyecciones" },
];

export default function Home() {
  return (
    <>
      <Cabecera />
      <main id="contenido" className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-16 px-4 py-16 sm:px-6">
        <section className="flex max-w-3xl flex-col items-center gap-6 text-center">
          <p className="rounded-full bg-primary-100 px-4 py-1.5 text-sm font-semibold text-primary-700">
            Gratis · Sin registro · Privado
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Calculá el precio real de tu producto
          </h1>
          <p className="text-xl text-gray-700">
            Sin Excel. Sin contador. Solo tus números reales: materiales, costos fijos y — lo más importante — el valor
            de tu tiempo.
          </p>
          <BotonLink href="/calculadora/producto" className="px-8 py-4 text-base">
            Empezar mi cálculo →
          </BotonLink>
          <p className="text-sm text-gray-500">5 pasos. Menos de 10 minutos.</p>
        </section>

        <section aria-labelledby="errores" className="flex w-full flex-col items-center gap-8">
          <h2 id="errores" className="text-2xl font-bold text-gray-900">
            Los 3 errores que te hacen perder plata
          </h2>
          <ul className="grid w-full gap-4 sm:grid-cols-3">
            {ERRORES.map((e) => (
              <li key={e.titulo} className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <span aria-hidden="true" className="text-2xl">
                  {e.icono}
                </span>
                <h3 className="font-semibold text-gray-900">{e.titulo}</h3>
                <p className="text-sm text-gray-700">{e.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="como-funciona" className="flex w-full flex-col items-center gap-8">
          <h2 id="como-funciona" className="text-2xl font-bold text-gray-900">
            Cómo funciona
          </h2>
          <ol className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
                <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <span aria-hidden="true" className="text-2xl">
                  {p.icono}
                </span>
                <h3 className="font-semibold text-gray-900">{p.titulo}</h3>
                <p className="text-sm text-gray-700">{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <Pie />
    </>
  );
}
