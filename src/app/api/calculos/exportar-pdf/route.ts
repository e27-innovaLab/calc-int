import { NextRequest, NextResponse } from "next/server";
import { exportarPdfSchema } from "@/lib/validaciones/exportar-pdf";
import { obtenerUsuario } from "@/lib/sesion";

export async function POST(req: NextRequest) {
    try {
    // 1. Verificamos la sesión usando los headers de la petición actual
        const user = await obtenerUsuario(req.headers);
    
        if (!user) {
            return NextResponse.json(
                { error: "Debés iniciar sesión para descargar el informe detallado en PDF." },
                { status: 401 }
            );
        }

    // 2. Parseamos y validamos el body con Zod
        const body = await req.json();
        const validacion = exportarPdfSchema.safeParse(body);

        if (!validacion.success) {
            return NextResponse.json({
                error: "Datos del simulador inválidos",
                detalles: validacion.error.flatten(),
            },
            { status: 400 }
        );
        }

        const datos = validacion.data;

    // 3. Procesamiento de escenarios
        const comparativaEscenarios = datos.escenarios.map((esc) => ({
            ...esc,
            diferenciaGanancia: esc.gananciaMensual - datos.base.gananciaMensual,
        }));

            return NextResponse.json({
                ok: true,
                usuario: user.email,
                reportePreparado: {
                ...datos,
                escenarios: comparativaEscenarios,
        },
        });

        } catch (error) {
            console.error("[POST /api/calculos/exportar-pdf]:", error);
            return NextResponse.json(
                { error: "Error interno al procesar la solicitud" },
                { status: 500 }
            );
    }
}