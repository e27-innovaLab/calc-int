import { z } from "zod";

// Proteccion contra payloads corruptos
/* Validamos los datos entrantes en el backend antes de pasarlos al motor financiero
  para garantizar que no lleguen strings vacías en campos obligatorios ni números negativos. 
*/
const decimalStringSchema = z.string().refine((val) => {
  if (val.trim() === "") return false;
  const num = Number(val);
  return !isNaN(num) && num >= 0;
}, { message: "Debe ser un número válido mayor o igual a cero" });

export const calculoInputSchema = z.object({
  configuracion: z.object({
    tipo: z.enum(["producto", "servicio"]),
    nombre: z.string().min(1, "El nombre es obligatorio"),
    moneda: z.enum(["ARS", "USD"]),
    periodo: z.enum(["semanal", "mensual", "anual"]),
    unidadVenta: z.string().min(1, "La unidad de venta es obligatoria"),
    volumenEstimado: z.string().refine((val) => Number(val) > 0, {
      message: "El volumen estimado debe ser un número mayor a cero",
    }),
  }),
  costosFijos: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    montoPeriodo: decimalStringSchema,
  })),
  costosVariables: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    montoUnitario: decimalStringSchema,
  })),
  costosIndirectos: z.array(z.object({
    id: z.string(),
    nombre: z.string(),
    monto: decimalStringSchema,
    base: z.enum(["periodo", "unidad"]),
  })),
  trabajoPropio: z.object({
    incluir: z.boolean(),
    horasPeriodo: z.string(),
    valorHora: z.string(),
  }),
});