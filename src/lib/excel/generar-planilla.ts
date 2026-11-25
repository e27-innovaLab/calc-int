import ExcelJS from "exceljs";
import type { z } from "zod";
import type { esquemaCalculo } from "@/server/calculos/esquema";

export type CalculoParaExcel = z.infer<typeof esquemaCalculo>;

export function sanitizarNombreArchivo(nombre?: string): string {
  const base = (nombre || "calculo")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base || "calculo";
}

function aNumero(valor: string | undefined): number | null {
  if (!valor || valor.trim() === "") return null;
  const num = Number(valor);
  return Number.isFinite(num) ? num : null;
}

function escribirNumero(cell: ExcelJS.Cell, valor: number | null, formato?: string) {
  if (valor !== null) {
    cell.value = valor;
    if (formato) cell.numFmt = formato;
  } else {
    cell.value = "—";
  }
}

function estilizarEncabezado(row: ExcelJS.Row, fgArgb = "FF1F2937") {
  row.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: fgArgb } };
  row.height = 22;
  row.alignment = { vertical: "middle" };
}

function ajustarAnchos(hoja: ExcelJS.Worksheet) {
  hoja.columns.forEach((columna) => {
    let maxLength = 14;
    columna.eachCell?.({ includeEmpty: false }, (cell) => {
      const raw = cell.value;
      const texto =
        raw == null
          ? ""
          : typeof raw === "object" && "richText" in raw
            ? raw.richText.map((r) => r.text).join("")
            : String(raw);
      maxLength = Math.max(maxLength, texto.length + 4);
    });
    columna.width = Math.min(Math.max(maxLength, 14), 48);
  });
}

export async function generarPlanillaExcel(calculo: CalculoParaExcel): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Preciar";
  workbook.created = new Date();

  const titulo = calculo.configuracion.nombre.trim() || "Resumen de cálculo";
  const fechaTexto = new Date().toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // --- Hoja 1: Resumen y Configuración ---
  const hojaResumen = workbook.addWorksheet("Resumen");

  hojaResumen.mergeCells("A1:C1");
  const celdaTitulo = hojaResumen.getCell("A1");
  celdaTitulo.value = `PRECIAR · ${titulo}`;
  celdaTitulo.font = { name: "Calibri", size: 15, bold: true, color: { argb: "FFFFFFFF" } };
  celdaTitulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
  celdaTitulo.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  hojaResumen.getRow(1).height = 28;

  hojaResumen.getCell("A2").value = "Fecha de exportación:";
  hojaResumen.getCell("A2").font = { bold: true };
  hojaResumen.getCell("B2").value = fechaTexto;
  hojaResumen.getRow(2).height = 20;

  estilizarEncabezado(hojaResumen.getRow(4), "FF0A0A0A");
  hojaResumen.getRow(4).values = ["Parámetro / Configuración", "Valor", "Detalle"];

  const filasResumen: Array<{
    etiqueta: string;
    valor: number | string | null;
    formato?: string;
    detalle: string;
  }> = [
    { etiqueta: "Tipo", valor: calculo.configuracion.tipo, detalle: "Modelo del cálculo" },
    { etiqueta: "Ruta", valor: calculo.configuracion.ruta, detalle: "Estrategia de cálculo" },
    { etiqueta: "Moneda", valor: calculo.configuracion.moneda, detalle: "Moneda base" },
    { etiqueta: "Unidad de venta", valor: calculo.configuracion.unidadVenta || "—", detalle: "Unidad" },
    {
      etiqueta: "Unidades por lote",
      valor: aNumero(calculo.configuracion.unidadesPorLote),
      formato: "#,##0.##",
      detalle: "Cantidad por lote",
    },
    {
      etiqueta: "Lotes",
      valor: aNumero(calculo.configuracion.lotes),
      formato: "#,##0.##",
      detalle: "Cantidad de lotes",
    },
    {
      etiqueta: "Volumen mensual",
      valor: aNumero(calculo.configuracion.volumenMensual),
      formato: "#,##0.##",
      detalle: calculo.configuracion.unidadVenta || "Unidades / mes",
    },
    { etiqueta: "Modo de precio", valor: calculo.precio.modo, detalle: "Margen o manual" },
    {
      etiqueta: "Margen objetivo (%)",
      valor: aNumero(calculo.precio.margenPct),
      formato: "0.0",
      detalle: "Porcentaje de margen",
    },
    {
      etiqueta: "Precio manual",
      valor: aNumero(calculo.precio.precioManual),
      formato: "$ #,##0.00",
      detalle: "Precio ingresado manualmente",
    },
    {
      etiqueta: "Incluir trabajo propio",
      valor: calculo.trabajoPropio.incluir ? "Sí" : "No",
      detalle: "Mano de obra propia",
    },
    {
      etiqueta: "Horas por lote",
      valor: aNumero(calculo.trabajoPropio.horasPorLote),
      formato: "#,##0.##",
      detalle: "Horas dedicadas por lote",
    },
    {
      etiqueta: "Horas mensuales",
      valor: aNumero(calculo.trabajoPropio.horasMensuales),
      formato: "#,##0.##",
      detalle: "Horas dedicadas al mes",
    },
    {
      etiqueta: "Valor hora",
      valor: aNumero(calculo.trabajoPropio.valorHora),
      formato: "$ #,##0.00",
      detalle: "Valor por hora",
    },
    {
      etiqueta: "Sueldo mensual",
      valor: aNumero(calculo.trabajoPropio.sueldoMensual),
      formato: "$ #,##0.00",
      detalle: "Asignación mensual",
    },
    { etiqueta: "Paso actual", valor: calculo.pasoActual, detalle: "Estado en el simulador" },
  ];

  let filaActual = 5;
  for (const item of filasResumen) {
    const row = hojaResumen.getRow(filaActual);
    row.getCell(1).value = item.etiqueta;
    row.getCell(1).font = { bold: true };

    if (typeof item.valor === "number" || item.valor === null) {
      escribirNumero(row.getCell(2), item.valor, item.formato);
    } else {
      row.getCell(2).value = item.valor;
    }

    row.getCell(3).value = item.detalle;
    row.height = 20;
    filaActual += 1;
  }

  // --- Hoja 2: Costos ---
  const hojaCostos = workbook.addWorksheet("Costos");
  estilizarEncabezado(hojaCostos.getRow(1));
  hojaCostos.getRow(1).values = ["Categoría", "Concepto", "Frecuencia / Base", "Monto", "Nota"];

  let filaCosto = 2;

  for (const cf of calculo.costosFijos) {
    const row = hojaCostos.getRow(filaCosto++);
    row.getCell(1).value = "Fijo";
    row.getCell(2).value = cf.nombre;
    row.getCell(3).value = cf.frecuencia;
    escribirNumero(row.getCell(4), aNumero(cf.monto), "$ #,##0.00");
    row.getCell(5).value = cf.nota ?? "";
    row.height = 20;
  }

  for (const ci of calculo.costosIndirectos) {
    const row = hojaCostos.getRow(filaCosto++);
    row.getCell(1).value = "Indirecto";
    row.getCell(2).value = ci.nombre;
    row.getCell(3).value = ci.frecuencia;
    escribirNumero(row.getCell(4), aNumero(ci.monto), "$ #,##0.00");
    row.getCell(5).value = ci.nota ?? "";
    row.height = 20;
  }

  for (const cv of calculo.costosVariables) {
    const row = hojaCostos.getRow(filaCosto++);
    row.getCell(1).value = "Variable";
    row.getCell(2).value = cv.nombre;
    row.getCell(3).value = cv.base ? `base: ${cv.base}` : "unitario";
    escribirNumero(row.getCell(4), aNumero(cv.montoUnitario), "$ #,##0.00");
    row.getCell(5).value = cv.nota ?? "";
    row.height = 20;
  }

  // --- Hoja 3: Escenarios ---
  const hojaEscenarios = workbook.addWorksheet("Escenarios");
  estilizarEncabezado(hojaEscenarios.getRow(1));
  hojaEscenarios.getRow(1).values = [
    "Escenario",
    "Variación Insumos (%)",
    "Variación Precio (%)",
    "Variación Producción (%)",
  ];

  let filaEsc = 2;
  for (const esc of calculo.escenarios) {
    const row = hojaEscenarios.getRow(filaEsc++);
    row.getCell(1).value = esc.nombre;
    escribirNumero(row.getCell(2), aNumero(esc.insumosPct), "0.0");
    escribirNumero(row.getCell(3), aNumero(esc.precioPct), "0.0");
    escribirNumero(row.getCell(4), aNumero(esc.produccionPct), "0.0");
    row.height = 20;
  }

  ajustarAnchos(hojaResumen);
  ajustarAnchos(hojaCostos);
  ajustarAnchos(hojaEscenarios);

  const bufferSalida = await workbook.xlsx.writeBuffer();
  return Buffer.from(bufferSalida);
}