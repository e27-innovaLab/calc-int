/** Textos y reglas del onboarding del recorrido (Figma, «Onboarding»: una tarjeta por paso). */

export interface TerminoOnboarding {
  termino: string;
  /** Explicación corta, en lenguaje simple. Aparece al pasar el cursor, al enfocar o al tocar el chip. */
  definicion: string;
}

/** Fragmento del texto principal: lo marcado va en negrita. */
export interface TramoTexto {
  texto: string;
  negrita?: boolean;
}

export interface PasoOnboarding {
  /** Mismo orden y ruta que la barra de pasos. */
  ruta: string;
  etiqueta: string;
  titulo: string;
  cuerpo: TramoTexto[];
  /** Figma, paso 1: aviso en cursiva antes de los chips. En el resto del recorrido va «Dato útil». */
  invitacion?: string;
  datoUtil?: string;
  terminos: TerminoOnboarding[];
}

export const PASOS_ONBOARDING: PasoOnboarding[] = [
  {
    ruta: "/calculadora/producto",
    etiqueta: "Tu producto",
    titulo: "¡Empecemos! Son solo 5 pasos y podés volver atrás cuando quieras.",
    cuerpo: [{ texto: "Contanos qué vendés y cómo lo conseguís: si lo hacés vos o lo compras hecho." }],
    invitacion: "¿Una palabra rara? Pasá el cursor por encima:",
    terminos: [
      { termino: "Lote", definicion: "Una tanda: producís varias unidades en un mismo proceso, como una horneada o una tirada de velas." },
      { termino: "A medida", definicion: "Cada producto se hace de forma individual y exclusiva, a pedido." },
      { termino: "Reventa", definicion: "Comprás productos ya terminados y los vendés, sin fabricarlos." },
    ],
  },
  {
    ruta: "/calculadora/costos",
    etiqueta: "Costos",
    titulo: "Acá va todo lo que gastás para vender.",
    cuerpo: [
      { texto: "Separamos tus costos en " },
      { texto: "fijos", negrita: true },
      { texto: " (los pagás aunque no vendas) y " },
      { texto: "variables", negrita: true },
      { texto: " (dependen de cuánto producís). No hace falta que sea exacto: podés ajustarlo después." },
    ],
    datoUtil: "si dudás dónde va algo, preguntate «¿lo pago igual si no vendo nada?». Si la respuesta es sí, es fijo.",
    terminos: [
      { termino: "Costo fijo", definicion: "Lo que pagás todos los meses aunque no vendas nada: alquiler, servicios, herramientas." },
      { termino: "Costo variable", definicion: "Lo que gastás por cada unidad que hacés o vendés: materiales, envase, envío." },
      { termino: "Tu trabajo", definicion: "Tu tiempo también vale: lo sumamos como un costo para que tu precio te pague a vos." },
    ],
  },
  {
    ruta: "/calculadora/resumen",
    etiqueta: "Resumen",
    titulo: "¡Buen avance! Ya cargaste tus costos.",
    cuerpo: [{ texto: "Acá ves cuánto te cuesta realmente cada unidad. Es la base de todo lo que sigue." }],
    datoUtil: "si algo no te cierra, volvé a Costos y corregilo.",
    terminos: [
      { termino: "Costo unitario real", definicion: "Lo que de verdad te cuesta cada unidad: su costo variable más la parte que le toca de los costos fijos." },
      { termino: "Costos mensuales", definicion: "Lo que gastás en un mes para sostener tu negocio, vendas lo que vendas." },
    ],
  },
  {
    ruta: "/calculadora/precio",
    etiqueta: "Precio",
    titulo: "Ahora sí: elegí tu precio con tus números.",
    cuerpo: [
      { texto: "Elegí cuánto querés ganar y te sugerimos un precio, o probá con el tuyo. Lo mínimo es llegar al " },
      { texto: "equilibrio", negrita: true },
      { texto: ": el punto donde ya cubrís todos tus costos." },
    ],
    datoUtil: "si el precio no cubre ni el costo de la unidad, te lo vamos a avisar.",
    terminos: [
      { termino: "Ganancia", definicion: "Lo que te queda después de pagar todos los costos." },
      { termino: "Margen", definicion: "Qué parte del precio es ganancia. Si vendés a $100 y te quedan $40 después del costo, tu margen es 40 %." },
      { termino: "Equilibrio", definicion: "Cuántas unidades tenés que vender para cubrir todos tus costos. Desde ahí empezás a ganar." },
    ],
  },
  {
    ruta: "/calculadora/simulador",
    etiqueta: "Simulador",
    titulo: "¡Llegaste al final! Probá qué pasa si algo cambia.",
    cuerpo: [
      {
        texto:
          "Subí el precio, bajá un costo o vendé más o menos, y mirá cómo cambia tu ganancia. Son estimaciones para explorar, no una predicción. No toca tus datos cargados.",
      },
    ],
    datoUtil: "cuando termines, guardá tu resumen en PDF o imagen.",
    terminos: [
      { termino: "Escenario", definicion: "Una prueba de «¿qué pasa si…?» con otros números. No cambia lo que ya cargaste." },
      { termino: "Equilibrio", definicion: "Cuántas unidades tenés que vender para cubrir todos tus costos. Desde ahí empezás a ganar." },
    ],
  },
];

/** Paso del onboarding que corresponde a la ruta actual, o `null` fuera del recorrido. */
export function pasoOnboardingPorRuta(ruta: string | null): number | null {
  const i = PASOS_ONBOARDING.findIndex((p) => p.ruta === ruta);
  return i >= 0 ? i : null;
}

export const CLAVE_ONBOARDING = "preciar:onboarding-cerrados";

/** Lee los pasos cerrados de lo guardado. Cualquier valor raro (roto, viejo, manipulado) se ignora. */
export function leerCerrados(crudo: string | null): number[] {
  if (!crudo) return [];
  try {
    const valor: unknown = JSON.parse(crudo);
    if (!Array.isArray(valor)) return [];
    const validos = valor.filter((n): n is number => Number.isInteger(n) && n >= 0 && n < PASOS_ONBOARDING.length);
    return [...new Set(validos)].sort((a, b) => a - b);
  } catch {
    return [];
  }
}

export function conPasoCerrado(cerrados: number[], paso: number): number[] {
  return cerrados.includes(paso) ? cerrados : [...cerrados, paso].sort((a, b) => a - b);
}

export function sinPasoCerrado(cerrados: number[], paso: number): number[] {
  return cerrados.filter((n) => n !== paso);
}
