import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { esquemaCalculo, MAX_BYTES_CUERPO } from "@/server/calculos/esquema";
import { generarPlanillaExcel, sanitizarNombreArchivo } from "@/lib/excel/generar-planilla";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuth();
    const sesion = await auth.api.getSession({ headers: req.headers });

    if (!sesion?.user) {
      return NextResponse.json(
        { error: "Tenés que iniciar sesión para exportar la planilla Excel." },
        { status: 401 }
      );
    }

    const textoCuerpo = await req.text();
    const bytesCuerpo = new TextEncoder().encode(textoCuerpo).byteLength;

    if (bytesCuerpo > MAX_BYTES_CUERPO) {
      return NextResponse.json(
        { error: "El cuerpo de la petición supera el tamaño máximo permitido." },
        { status: 413 }
      );
    }

    let rawJson: unknown;
    try {
      rawJson = JSON.parse(textoCuerpo);
    } catch {
      return NextResponse.json(
        { error: "El cuerpo de la petición debe ser un JSON válido." },
        { status: 400 }
      );
    }

    const candidato =
      rawJson &&
      typeof rawJson === "object" &&
      "calculo" in rawJson &&
      rawJson.calculo &&
      typeof rawJson.calculo === "object"
        ? rawJson.calculo
        : rawJson;

    const validacion = esquemaCalculo.safeParse(candidato);
    if (!validacion.success) {
      return NextResponse.json(
        {
          error: "Datos inválidos para exportar el Excel.",
          detalles: validacion.error.flatten(),
        },
        { status: 400 }
      );
    }

    const buffer = await generarPlanillaExcel(validacion.data);
    const nombreArchivo = `preciar-${sanitizarNombreArchivo(
      validacion.data.configuracion.nombre
    )}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Error al generar planilla Excel:", error);
    return NextResponse.json(
      { error: "No se pudo generar la planilla Excel." },
      { status: 500 }
    );
  }
}