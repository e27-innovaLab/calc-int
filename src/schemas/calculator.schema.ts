import { z } from "zod";

export const FrecuenciaSchema = z.enum(["semanal", "mensual", "anual"]);

export const CostoFijoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  monto: z.string(),
  frecuencia: FrecuenciaSchema,
  categoria: z.literal("fijo"),
});

export const CostoIndirectoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  monto: z.string(),
  frecuencia: FrecuenciaSchema,
  categoria: z.literal("indirecto"),
});

/** Cómo produce o consigue lo que vende el usuario. Cambia qué datos pide el cálculo, no las fórmulas. */
export const RutaSchema = z.enum(["lotes", "unidad", "reventa"]);

/** Base en la que se cargó el monto de un insumo: por unidad (tal cual) o por lote completo (ruta «lotes»). */
export const BaseInsumoSchema = z.enum(["unidad", "lote"]);

export const CostoVariableSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  /** Monto del insumo en la base indicada por `base` (por unidad si no se envía). */
  montoUnitario: z.string(),
  base: BaseInsumoSchema.optional(),
  categoria: z.literal("variable"),
});

export const TrabajoPropioSchema = z.object({
  incluir: z.boolean(),
  /** Horas por lote (ruta «lotes») o por unidad (ruta «unidad»). La ruta «reventa» no las usa. */
  horasPorLote: z.string().default(""),
  /** Se deriva de las horas y los lotes; si se envía, tiene que coincidir. */
  horasMensuales: z.string().default(""),
  valorHora: z.string().default(""),
  /** Sueldo fijo mensual pretendido. Solo lo usa la ruta «reventa»: entra una sola vez a los costos fijos. */
  sueldoMensual: z.string().default(""),
});

export const ConfiguracionSchema = z.object({
  tipo: z.enum(["producto", "servicio"]),
  /** Si no se envía, la ruta es «lotes» (el comportamiento de antes de existir las otras dos). */
  ruta: RutaSchema.default("lotes"),
  nombre: z.string(),
  moneda: z.literal("ARS"),
  unidadVenta: z.string(),
  /** Solo en la ruta «lotes». En «unidad» y «reventa» no se usa (queda fija en 1). */
  unidadesPorLote: z.string().default(""),
  /** Lotes por mes (ruta «lotes»). En «unidad» y «reventa» se ignora: el volumen es `volumenMensual`. */
  lotes: z.string().default(""),
  /** Ruta «lotes»: se deriva de unidades por lote × lotes y, si se envía, tiene que coincidir. Otras rutas: unidades por mes. */
  volumenMensual: z.string().default(""),
});

export const PrecioSchema = z.object({
  modo: z.enum(["margen", "manual"]),
  margenPct: z.string(),
  precioManual: z.string(),
});

export const CalculateRequestSchema = z.object({
  configuracion: ConfiguracionSchema,
  costosFijos: z.array(CostoFijoSchema),
  costosVariables: z.array(CostoVariableSchema),
  costosIndirectos: z.array(CostoIndirectoSchema),
  trabajoPropio: TrabajoPropioSchema,
  precio: PrecioSchema.optional(),
  simulacion: z
    .object({
      tipo: z.enum(["insumos", "precio", "produccion"]),
      variacionPct: z.string(),
    })
    .optional(),
});

export type CalculateRequest = z.infer<typeof CalculateRequestSchema>;