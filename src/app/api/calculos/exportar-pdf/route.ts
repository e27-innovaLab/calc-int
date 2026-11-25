import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import Decimal from "decimal.js";

import { esquemaCalculo } from "@/server/calculos/esquema";
import { obtenerUsuario } from "@/lib/sesion";
import { calcularResumenCostos } from "@/domain/motor/costos";
import {
  composicionCostoUnitario,
  costoTotalPorLote,
  detalleDeCostos,
} from "@/domain/motor/resumen";
import {
  analizarPrecio,
  datosGrafico,
  nivelDeMargen,
  precioElegido,
} from "@/domain/motor/precio";
import {
  metaDeVentas,
  simularVariaciones,
  situacionBase,
} from "@/domain/motor/escenarios";
import { crearDocumentoReportePdf, type DatosReportePdf } from "@/lib/pdf/plantilla-reporte";

export async function POST(req: NextRequest) {
  try {
    // 1. Verificación de autenticación
    const user = await obtenerUsuario(req.headers);
    if (!user) {
      return NextResponse.json(
        { error: "Debés iniciar sesión para descargar el informe detallado en PDF." },
        { status: 401 },
      );
    }

    // 2. Parseo y validación con el esquema oficial del Cálculo
    const body = await req.json();
    const validacion = esquemaCalculo.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        {
          error: "Datos del cálculo inválidos para exportar PDF",
          detalles: validacion.error.flatten(),
        },
        { status: 400 },
      );
    }

    const calculo = validacion.data;
    const resumen = calcularResumenCostos(calculo);
    const precio = precioElegido(calculo);

    if (!resumen.costoUnitario || !resumen.volumenMensual || !precio) {
      return NextResponse.json(
        { error: "Completá costos, volumen y precio antes de exportar el PDF." },
        { status: 400 },
      );
    }

    const analisis = analizarPrecio(calculo, precio);
    const base = situacionBase(calculo, precio);
    const composicion = composicionCostoUnitario(calculo);
    const detalle = detalleDeCostos(calculo);
    const graficoEquilibrio = datosGrafico(calculo, precio);

    if (!analisis || !base || !composicion || !graficoEquilibrio) {
      return NextResponse.json(
        { error: "No se pudo calcular el análisis completo para el reporte." },
        { status: 400 },
      );
    }

    // 3. Simulación de escenarios del Paso 5
    const escenariosCalculados = calculo.escenarios
      .map((esc) => {
        const res = simularVariaciones(calculo, precio, {
          insumosPct: esc.insumosPct,
          precioPct: esc.precioPct,
          produccionPct: esc.produccionPct,
        });
        if (!res) return null;

        const diffCosto = new Decimal(res.costoUnitario).minus(base.costoUnitario);
        const diffPrecio = new Decimal(res.precio).minus(base.precio);
        const diffMargen = new Decimal(res.margenNetoPct).minus(base.margenNetoPct);
        const diffEquilibrio =
          res.puntoEquilibrio && base.puntoEquilibrio
            ? new Decimal(res.puntoEquilibrio).minus(base.puntoEquilibrio)
            : null;
        const diffGanancia = new Decimal(res.gananciaMensual).minus(base.gananciaMensual);

        return {
          id: esc.id,
          nombre: esc.nombre,
          insumosPct: esc.insumosPct,
          precioPct: esc.precioPct,
          produccionPct: esc.produccionPct,
          situacion: res,
          deltas: {
            costoUnitario: diffCosto.toString(),
            precio: diffPrecio.toString(),
            margenPts: diffMargen.toString(),
            equilibrioUds: diffEquilibrio ? diffEquilibrio.toString() : null,
            ganancia: diffGanancia.toString(),
          },
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    // 4. Armado del paquete completo para las 4 páginas del PDF
    const datosPdf: DatosReportePdf = {
      usuarioEmail: user.email ?? "Usuario registrado",
      fecha: new Date().toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      calculo,
      resumen,
      costoTotalLote: costoTotalPorLote(
        resumen.costoUnitario,
        calculo.configuracion.unidadesPorLote,
      ),
      composicion,
      detalle,
      analisis,
      nivelMargen:
        calculo.precio.modo === "margen"
          ? nivelDeMargen(calculo.precio.margenPct)
          : nivelDeMargen(analisis.margenResultantePct),
      graficoEquilibrio,
      base,
      escenarios: escenariosCalculados,
      metaVentasMensual: metaDeVentas(analisis.puntoEquilibrioUnidades),
    };

    // 5. Generación del buffer binario del PDF
    const pdfBuffer = await renderToBuffer(crearDocumentoReportePdf(datosPdf));

    // 6. Normalización del nombre de archivo
    const nombreBase = calculo.configuracion.nombre.trim() || "reporte";
    const nombreArchivo =
      nombreBase
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "reporte";

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="preciar-${nombreArchivo}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[POST /api/calculos/exportar-pdf]:", error);
    return NextResponse.json(
      { error: "Error interno al generar el documento PDF" },
      { status: 500 },
    );
  }
}