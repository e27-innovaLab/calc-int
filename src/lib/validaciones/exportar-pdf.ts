
import { z } from "zod";

const escenarioSchema = z.object({
  nombre: z.string().min(1).default("Escenario alternativo"),
  variacionCostos: z.number().default(0),
  variacionPrecio: z.number().default(0),
  variacionVolumen: z.number().default(0),
  costoUnitario: z.number(),
  precioVenta: z.number(),
  margenNeto: z.number(),
  puntoEquilibrio: z.number(),
  gananciaMensual: z.number(),
});

export const exportarPdfSchema = z.object({
  calculoId: z.string().optional(),
  nombreProducto: z.string().min(1).default("Producto sin nombre"),
  ruta: z.string().default("estandar"),
  sueldoMensual: z.union([z.string(), z.number()]).default("0"),
  base: z.object({
    costoUnitario: z.number(),
    precioVenta: z.number(),
    margenNeto: z.number(),
    puntoEquilibrio: z.number(),
    gananciaMensual: z.number(),
    costosFijos: z.number().default(0),
    costosVariables: z.number().default(0),
    volumenMensual: z.number().default(1),
  }),
  escenarios: z.array(escenarioSchema).max(6).default([]),
});

export type ExportarPdfPayload = z.infer<typeof exportarPdfSchema>;