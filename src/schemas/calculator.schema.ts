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

export const CostoVariableSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  montoUnitario: z.string(),
  categoria: z.literal("variable"),
});

export const TrabajoPropioSchema = z.object({
  incluir: z.boolean(),
  horasPorLote: z.string(),
  horasMensuales: z.string(),
  valorHora: z.string(),
});

export const ConfiguracionSchema = z.object({
  tipo: z.enum(["producto", "servicio"]),
  nombre: z.string(),
  moneda: z.literal("ARS"),
  unidadVenta: z.string(),
  unidadesPorLote: z.string(),
  lotes: z.string(),
  volumenMensual: z.string(),
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