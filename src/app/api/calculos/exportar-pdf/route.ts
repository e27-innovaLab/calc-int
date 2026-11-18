import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { exportarPdfSchema } from "@/lib/validaciones/exportar-pdf";
import { obtenerUsuario } from "@/lib/sesion";
import { crearDocumentoReportePdf } from "@/lib/pdf/plantilla-reporte";

export async function POST(req: NextRequest) {
  try {
    // 1. Verificación de autenticación
    const user = await obtenerUsuario(req.headers);
    if (!user) {
      return NextResponse.json(
        {
          error:
            "Debés iniciar sesión para descargar el informe detallado en PDF.",
        },
        { status: 401 }
      );
    }

    // 2. Parseo y validación con Zod
    const body = await req.json();
    const validacion = exportarPdfSchema.safeParse(body);

    if (!validacion.success) {
      return NextResponse.json(
        {
          error: "Datos del simulador inválidos",
          detalles: validacion.error.flatten(),
        },
        { status: 400 }
      );
    }

    const datos = validacion.data;

    // 3. Procesamiento de métricas comparativas
    const comparativaEscenarios = datos.escenarios.map((esc) => ({
      ...esc,
      diferenciaGanancia: esc.gananciaMensual - datos.base.gananciaMensual,
      variacionPorcentualGanancia:
        datos.base.gananciaMensual !== 0
          ? Number(
              (
                ((esc.gananciaMensual - datos.base.gananciaMensual) /
                  Math.abs(datos.base.gananciaMensual)) *
                100
              ).toFixed(1)
            )
          : 0,
    }));

    // 4. Generación del buffer binario del PDF
    const pdfBuffer = await renderToBuffer(
      crearDocumentoReportePdf({
        usuarioEmail: user.email ?? "Usuario registrado",
        datos,
        escenarios: comparativaEscenarios,
      })
    );

    // 5. Normalización del nombre de archivo (slug)
    const nombreArchivo =
      datos.nombreProducto
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "reporte";

    // 6. Respuesta HTTP con binario descargable
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
      { status: 500 }
    );
  }
}