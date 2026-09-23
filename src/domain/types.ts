/**
 * Tipos del dominio — Calculadora Inteligente de Costos, Precios y Punto de Equilibrio.
 *
 * Convención de importes: se guardan como `string` (ej. "1250.50") y NO como `number`,
 * para no perder precisión. El motor de cálculo los convierte con Decimal.js.
 * El formateo visual ($ 1.250,50) se hace solo en la interfaz.
 */

/** Importe o cantidad decimal en formato string, parseable por Decimal.js. */
export type DecimalString = string;

/** Identificador único (usar crypto.randomUUID()). */
export type Id = string;

// ─────────────────────────────────────────────
// 1. Configuración inicial (paso 1 del recorrido)
// ─────────────────────────────────────────────

export type TipoOferta = "producto" | "servicio";

/** Monedas soportadas en el MVP. Ajustar según lo acordado en Semana 0. */
export type Moneda = "ARS" | "USD";

export type Periodo = "semanal" | "mensual" | "anual";

export interface Configuracion {
  tipo: TipoOferta;
  /** Nombre del producto o servicio. Ej: "Torta de chocolate". */
  nombre: string;
  moneda: Moneda;
  periodo: Periodo;
  /** Unidad en la que se vende. Ej: "unidad", "kg", "hora", "sesión". */
  unidadVenta: string;
  /** Unidades/servicios que se estima vender en el período. Debe ser > 0. */
  volumenEstimado: DecimalString;
}

// ─────────────────────────────────────────────
// 2. Conceptos de costo
// ─────────────────────────────────────────────

/** Campos comunes a todo concepto de costo (base del componente reutilizable). */
interface ConceptoBase {
  id: Id;
  /** Descripción libre. Ej: "Alquiler", "Harina", "Comisión Mercado Pago". */
  nombre: string;
  /** Nota opcional para el usuario. */
  nota?: string;
}

/** Se mantiene igual dentro del período, sin importar cuánto se venda. */
export interface CostoFijo extends ConceptoBase {
  categoria: "fijo";
  /** Monto total del concepto en el período configurado. */
  montoPeriodo: DecimalString;
}

/** Se asocia directamente a cada unidad vendida. */
export interface CostoVariable extends ConceptoBase {
  categoria: "variable";
  /** Costo por cada unidad de venta. */
  montoUnitario: DecimalString;
}

/**
 * Otros costos que suelen quedar afuera del cálculo intuitivo.
 * Pueden cargarse por período o por unidad — a confirmar con el equipo
 * cómo se clasifican para no contabilizarlos dos veces.
 */
export interface CostoIndirecto extends ConceptoBase {
  categoria: "indirecto";
  base: "periodo" | "unidad";
  monto: DecimalString;
}

export type ConceptoCosto = CostoFijo | CostoVariable | CostoIndirecto;
export type CategoriaCosto = ConceptoCosto["categoria"];

// ─────────────────────────────────────────────
// 3. Trabajo propio
// ─────────────────────────────────────────────

export interface TrabajoPropio {
  /** Si el usuario decide incluir el valor de su tiempo en el costo. */
  incluir: boolean;
  /** Horas trabajadas en el período. */
  horasPeriodo: DecimalString;
  /** Cuánto vale una hora de trabajo. */
  valorHora: DecimalString;
}

// ─────────────────────────────────────────────
// 4. Borrador del cálculo (estado global del recorrido)
// ─────────────────────────────────────────────

export type PasoRecorrido =
  | "configuracion"
  | "costos-fijos"
  | "costos-variables"
  | "trabajo-indirectos"
  | "resumen";

export interface Calculo {
  id: Id;
  configuracion: Configuracion;
  costosFijos: CostoFijo[];
  costosVariables: CostoVariable[];
  costosIndirectos: CostoIndirecto[];
  trabajoPropio: TrabajoPropio;
  /** Paso en el que quedó el usuario (para retomar). */
  pasoActual: PasoRecorrido;
  creadoEn: string; // ISO 8601
  actualizadoEn: string; // ISO 8601
}

// ─────────────────────────────────────────────
// 5. Resultados del motor (Semana 2 — se dejan definidos para acordar el contrato)
// ─────────────────────────────────────────────

export interface ResultadoCostos {
  totalCostosFijos: DecimalString;
  costoVariableUnitario: DecimalString;
  totalIndirectosPeriodo: DecimalString;
  totalTrabajoPropio: DecimalString;
  /** Costo total del período para el volumen estimado. */
  costoTotalPeriodo: DecimalString;
  /** Costo total / volumen estimado. */
  costoUnitario: DecimalString;
}

// ─────────────────────────────────────────────
// 6. Validaciones
// ─────────────────────────────────────────────

/** "error" bloquea el cálculo; "advertencia" solo informa. */
export type Severidad = "error" | "advertencia";

export interface ErrorValidacion {
  /** Ruta del campo con problema. Ej: "configuracion.volumenEstimado", "costosFijos.2.montoPeriodo". */
  campo: string;
  mensaje: string;
  severidad: Severidad;
}

// ─────────────────────────────────────────────
// 7. Valores iniciales
// ─────────────────────────────────────────────

export const CONFIGURACION_INICIAL: Configuracion = {
  tipo: "producto",
  nombre: "",
  moneda: "ARS",
  periodo: "mensual",
  unidadVenta: "unidad",
  volumenEstimado: "",
};

export const TRABAJO_PROPIO_INICIAL: TrabajoPropio = {
  incluir: false,
  horasPeriodo: "",
  valorHora: "",
};
