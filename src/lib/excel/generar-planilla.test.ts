import ExcelJS from "exceljs";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CalculoParaExcel } from "@/lib/excel/generar-planilla";
import { generarPlanillaExcel, sanitizarNombreArchivo } from "@/lib/excel/generar-planilla";

const getSessionMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getAuth: () => ({
    api: {
      getSession: getSessionMock,
    },
  }),
}));

const calculoValido: CalculoParaExcel = {
  configuracion: {
    tipo: "producto",
    nombre: "Perfume Árabe 100ml",
    moneda: "ARS",
    unidadVenta: "Unidad",
    unidadesPorLote: "10",
    lotes: "2",
    volumenMensual: "20",
    ruta: "lotes",
  },
  costosFijos: [
    {
      id: "cf-1",
      nombre: "Alquiler depósito",
      categoria: "fijo",
      monto: "120000",
      frecuencia: "mensual",
      nota: "Espacio de guardado",
    },
  ],
  costosVariables: [
    {
      id: "cv-1",
      nombre: "Frasco y packaging",
      categoria: "variable",
      montoUnitario: "3500",
      base: "unidad",
    },
  ],
  costosIndirectos: [
    {
      id: "ci-1",
      nombre: "Etiquetas e impresión",
      categoria: "indirecto",
      monto: "15000",
      frecuencia: "mensual",
    },
  ],
  trabajoPropio: {
  incluir: true,
  horasPorLote: "2",
  horasMensuales: "8",
  valorHora: "5000",
  sueldoMensual: "",
},
  precio: {
    modo: "margen",
    margenPct: "35",
    precioManual: "",
  },
  escenarios: [
    {
      id: "esc-1",
      nombre: "Conservador",
      insumosPct: "10",
      precioPct: "0",
      produccionPct: "-15",
    },
  ],
  pasoActual: "simulador",
};

describe("generarPlanillaExcel", () => {
  it("genera un libro .xlsx con las hojas Resumen, Costos y Escenarios", async () => {
    const buffer = await generarPlanillaExcel(calculoValido);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.byteLength).toBeGreaterThan(0);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    expect(workbook.worksheets.map((ws) => ws.name)).toEqual([
      "Resumen",
      "Costos",
      "Escenarios",
    ]);
    expect(workbook.getWorksheet("Costos")?.getCell("B2").value).toBe("Alquiler depósito");
    expect(workbook.getWorksheet("Escenarios")?.getCell("A2").value).toBe("Conservador");
  });

  it("sanitiza nombres de archivo con acentos y símbolos", () => {
    expect(sanitizarNombreArchivo("Perfume Árabe #1")).toBe("perfume-arabe-1");
    expect(sanitizarNombreArchivo("")).toBe("calculo");
  });
});

describe("POST /api/calculos/exportar-excel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve 401 si no hay sesión activa", async () => {
    getSessionMock.mockResolvedValue(null);

    const { POST } = await import("@/app/api/calculos/exportar-excel/route");
    const req = new NextRequest("http://localhost:3000/api/calculos/exportar-excel", {
      method: "POST",
      body: JSON.stringify(calculoValido),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("devuelve 400 si el payload no cumple esquemaCalculo", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });

    const { POST } = await import("@/app/api/calculos/exportar-excel/route");
    const req = new NextRequest("http://localhost:3000/api/calculos/exportar-excel", {
      method: "POST",
      body: JSON.stringify({ configuracion: { nombre: "Incompleto" } }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("devuelve 200 y el header de descarga .xlsx con sesión válida", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });

    const { POST } = await import("@/app/api/calculos/exportar-excel/route");
    const req = new NextRequest("http://localhost:3000/api/calculos/exportar-excel", {
      method: "POST",
      body: JSON.stringify({ calculo: calculoValido }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(res.headers.get("Content-Disposition")).toContain(
      'filename="preciar-perfume-arabe-100ml.xlsx"'
    );
  });
});