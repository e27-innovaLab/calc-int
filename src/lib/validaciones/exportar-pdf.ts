import { z } from "zod";

/**
 * Esquema individual para cada escenario alternativo simulado por el usuario.
 * Se asignan valores por defecto (0) para evitar fallos si algún campo viene vacío.
 */
const escenarioPdfSchema = z.object({
  nombre: z.string().default("Escenario"),
  variacionCostos: z.number().default(0),
  variacionPrecio: z.number().default(0),
  variacionVolumen: z.number().default(0),
  costoUnitario: z.number().default(0),
  precioVenta: z.number().default(0),
  margenNeto: z.number().default(0),
  puntoEquilibrio: z.number().default(0),
  gananciaMensual: z.number().default(0),
});

/**
 * Esquema principal del payload que recibe POST /api/calculos/exportar-pdf.
 * Incluye tanto los totales generales como el desglose opcional (gastos fijos,
 * indirectos, insumos y facturación mínima) requerido por el diseño de UX/UI.
 */
export const exportarPdfSchema = z.object({
  nombreProducto: z.string().min(1).default("Producto sin nombre"),
  ruta: z.string().default("Por unidad"),
  sueldoMensual: z.union([z.number(), z.string()]).optional().default(0),
  base: z.object({
    // Métricas principales de "Tu resultado"
    costoUnitario: z.number(),
    precioVenta: z.number(),
    margenNeto: z.number(),
    puntoEquilibrio: z.number(),
    gananciaMensual: z.number(),

    // Supuestos generales ingresados en el simulador
    volumenMensual: z.number().default(1),
    costosFijos: z.number().default(0),
    costosVariables: z.number().default(0),

    // Campos desglosados para las barras de composición y tarjeta de equilibrio UX/UI
    // Son opcionales para mantener compatibilidad si el front envía solo los totales
    gastosFijos: z.number().optional(),
    indirectos: z.number().optional().default(0),
    insumosUnitarios: z.number().optional(),
    facturacionMinima: z.number().optional(),
  }),
  // Límite máximo de 6 escenarios comparativos en la segunda página del informe
  escenarios: z.array(escenarioPdfSchema).max(6).default([]),
});

export type ExportarPdfPayload = z.infer<typeof exportarPdfSchema>;