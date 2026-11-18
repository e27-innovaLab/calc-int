import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Line,
  Circle,
} from "@react-pdf/renderer";
import type { ExportarPdfPayload } from "@/lib/validaciones/exportar-pdf";

/**
 * Representa un escenario ya procesado en el endpoint con las variaciones
 * absolutas y porcentuales respecto de la situación base.
 */
export interface EscenarioProcesado {
  nombre: string;
  variacionCostos: number;
  variacionPrecio: number;
  variacionVolumen: number;
  costoUnitario: number;
  precioVenta: number;
  margenNeto: number;
  puntoEquilibrio: number;
  gananciaMensual: number;
  diferenciaGanancia: number;
  variacionPorcentualGanancia: number;
}

interface ReporteProps {
  usuarioEmail: string;
  datos: ExportarPdfPayload;
  escenarios: EscenarioProcesado[];
}

/**
 * Hoja de estilos para @react-pdf/renderer siguiendo el diseño definido por UX/UI:
 * - Paleta limpia con tarjetas celestes (#d6ebfa), barras (#38bdf8) y contenedores grises (#f3f4f6).
 * - Tipografía estándar Helvetica para garantizar compatibilidad en entorno serverless.
 */
const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 42,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  // --- ENCABEZADO ---
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 22,
  },
  brandLogo: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0f172a",
    width: 72,
    paddingTop: 2,
  },
  headerInfo: {
    flex: 1,
  },
  headerKicker: {
    fontSize: 7.5,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 2,
    marginBottom: 3,
  },
  headerMeta: {
    fontSize: 8,
    color: "#64748b",
  },
  // --- TÍTULOS DE SECCIÓN ---
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    marginTop: 14,
    marginBottom: 10,
  },
  // --- BLOQUE 1: TARJETAS CELESTES ("TU RESULTADO") ---
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  kpiCard: {
    width: "48.8%",
    backgroundColor: "#d6ebfa",
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginBottom: 2,
  },
  kpiLabel: {
    fontSize: 8.5,
    color: "#334155",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
  },
  // --- BLOQUE 2: GRILLA DE 2 COLUMNAS ("DATOS QUE INGRESASTE") ---
  inputsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 18,
    marginBottom: 8,
  },
  inputsCol: {
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  inputLabel: {
    fontSize: 8.5,
    color: "#64748b",
  },
  inputValue: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#0f172a",
  },
  // --- BLOQUE 3: BARRAS DE COMPOSICIÓN DEL COSTO ---
  compItem: {
    marginBottom: 10,
  },
  compHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  compName: {
    fontSize: 8.5,
    color: "#334155",
  },
  compAmount: {
    fontSize: 8.5,
    color: "#64748b",
  },
  trackBar: {
    width: "100%",
    height: 5,
    backgroundColor: "#e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  // --- BLOQUE 4: TARJETA PUNTO DE EQUILIBRIO + GRÁFICO SVG ---
  breakevenCard: {
    marginTop: 14,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakevenTextCol: {
    width: "44%",
  },
  breakevenLabel: {
    fontSize: 9.5,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 4,
  },
  breakevenMain: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },
  breakevenSub: {
    fontSize: 8,
    color: "#64748b",
  },
  // --- PÁGINA 2: TABLA COMPARATIVA DE ESCENARIOS ---
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#d6ebfa",
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 8.5,
    fontWeight: "bold",
    color: "#0f172a",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 8.5,
  },
  colName: { width: "28%" },
  colNum: { width: "18%", textAlign: "right" },
  // --- PIE DE PÁGINA ---
  footer: {
    position: "absolute",
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: "#94a3b8",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 6,
  },
});

/**
 * Formatea importes en pesos argentinos redondeados sin decimales ($14.050),
 * coincidiendo con la presentación visual del mockup de UX/UI.
 */
const fmtEntero = (valor: number) =>
  `$${Math.round(valor).toLocaleString("es-AR")}`;

/**
 * Genera el árbol JSX de <Document> listo para ser pasado a `renderToBuffer()`.
 * Incluye 1 página principal con el resumen completo y, si existen escenarios,
 * una segunda página con la tabla comparativa exclusiva para usuarios logueados.
 */
export function crearDocumentoReportePdf({
  usuarioEmail,
  datos,
  escenarios,
}: ReporteProps) {
  const fecha = new Date().toLocaleDateString("es-AR");
  const volumen = Math.max(1, datos.base.volumenMensual);
  const sueldoMensual = Number(datos.sueldoMensual) || 0;

  // 1. Cálculo de rubros mensuales y unitarios para la sección "Cómo se compone tu costo"
  // Si no se reciben desglosados, se deducen de los totales generales para evitar ceros erróneos.
  const gastosFijosMes =
    datos.base.gastosFijos ??
    Math.max(0, datos.base.costosFijos - sueldoMensual);
  const indirectosMes = datos.base.indirectos ?? 0;

  const trabajoUnitario = sueldoMensual / volumen;
  const gastosFijosUnitario = gastosFijosMes / volumen;
  const indirectosUnitario = indirectosMes / volumen;
  const insumosUnitario =
    datos.base.insumosUnitarios ?? datos.base.costosVariables;

  // Suma base (mínimo 1 para evitar división por cero en los porcentajes)
  const totalComp = Math.max(
    1,
    trabajoUnitario + gastosFijosUnitario + indirectosUnitario + insumosUnitario
  );

  // Arreglo ordenado para renderizar las 4 barras horizontales de incidencia en el costo
  const composicion = [
    { nombre: "Tu trabajo", monto: trabajoUnitario },
    { nombre: "Gastos fijos", monto: gastosFijosUnitario },
    { nombre: "Indirectos", monto: indirectosUnitario },
    { nombre: "Insumos", monto: insumosUnitario },
  ].map((item) => {
    const pct = Number(((item.monto / totalComp) * 100).toFixed(1));
    return { ...item, pct };
  });

  // 2. Facturación mínima de equilibrio (si no viene precalculada, unidades * precio)
  const facturacionMinima =
    datos.base.facturacionMinima ??
    datos.base.puntoEquilibrio * datos.base.precioVenta;

  const totalPaginas = escenarios.length > 0 ? 2 : 1;

  return (
    <Document>
      {/* =====================================================================
          PÁGINA 1: RESUMEN DEL CÁLCULO (DISEÑO UX/UI)
         ===================================================================== */}
      <Page size="A4" style={styles.page}>
        {/* ENCABEZADO: Marca a la izquierda + Kicker, título y metadatos */}
        <View style={styles.header}>
          <Text style={styles.brandLogo}>Preciar</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.headerKicker}>RESUMEN DEL CÁLCULO</Text>
            <Text style={styles.productTitle}>{datos.nombreProducto}</Text>
            <Text style={styles.headerMeta}>
              {datos.ruta} · {fecha} · Valores en pesos argentinos, período
              mensual
            </Text>
          </View>
        </View>

        {/* SECCIÓN 1: TU RESULTADO (Grilla 2x2 de tarjetas celestes) */}
        <Text style={styles.sectionTitle}>Tu resultado</Text>
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Costo unitario real</Text>
            <Text style={styles.kpiValue}>
              {fmtEntero(datos.base.costoUnitario)}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Precio sugerido</Text>
            <Text style={styles.kpiValue}>
              {fmtEntero(datos.base.precioVenta)}
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Equilibrio</Text>
            <Text style={styles.kpiValue}>
              {datos.base.puntoEquilibrio} unidades
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Ganancia mensual</Text>
            <Text style={styles.kpiValue}>
              {fmtEntero(datos.base.gananciaMensual)}
            </Text>
          </View>
        </View>

        {/* SECCIÓN 2: DATOS QUE INGRESASTE (Tabla paralela de 2 columnas) */}
        <Text style={styles.sectionTitle}>Datos que ingresaste</Text>
        <View style={styles.inputsGrid}>
          {/* Columna izquierda */}
          <View style={styles.inputsCol}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Volumen mensual</Text>
              <Text style={styles.inputValue}>
                {datos.base.volumenMensual} unidades por mes
              </Text>
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Trabajo propio</Text>
              <Text style={styles.inputValue}>{fmtEntero(sueldoMensual)}</Text>
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Variable por unidad</Text>
              <Text style={styles.inputValue}>
                {fmtEntero(datos.base.costosVariables)}
              </Text>
            </View>
          </View>

          {/* Columna derecha */}
          <View style={styles.inputsCol}>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Gastos fijos</Text>
              <Text style={styles.inputValue}>{fmtEntero(gastosFijosMes)}</Text>
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Indirectos</Text>
              <Text style={styles.inputValue}>{fmtEntero(indirectosMes)}</Text>
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Margen</Text>
              <Text style={styles.inputValue}>
                {datos.base.margenNeto.toFixed(1).replace(".", ",")}%
              </Text>
            </View>
          </View>
        </View>

        {/* SECCIÓN 3: CÓMO SE COMPONE TU COSTO (Barras de progreso horizontales) */}
        <Text style={styles.sectionTitle}>Cómo se compone tu costo</Text>
        {composicion.map((item, idx) => {
          // Aseguramos un ancho mínimo de 1% para que los valores muy bajos sigan siendo visibles
          const anchoBarra = `${Math.max(1, Math.min(100, item.pct))}%`;
          return (
            <View key={idx} style={styles.compItem}>
              <View style={styles.compHeader}>
                <Text style={styles.compName}>{item.nombre}</Text>
                <Text style={styles.compAmount}>
                  {fmtEntero(item.monto)} · {String(item.pct).replace(".", ",")}%
                </Text>
              </View>
              <View style={styles.trackBar}>
                <View
                  style={{
                    width: anchoBarra,
                    height: 5,
                    backgroundColor: "#38bdf8",
                    borderRadius: 3,
                  }}
                />
              </View>
            </View>
          );
        })}

        {/* SECCIÓN 4: TARJETA PUNTO DE EQUILIBRIO CON GRÁFICO VECTORIAL SVG */}
        <View style={styles.breakevenCard}>
          <View style={styles.breakevenTextCol}>
            <Text style={styles.breakevenLabel}>Punto de equilibrio</Text>
            <Text style={styles.breakevenMain}>
              {datos.base.puntoEquilibrio} unidades
            </Text>
            <Text style={styles.breakevenSub}>
              Facturación mínima: {fmtEntero(facturacionMinima)}
            </Text>
          </View>

          {/* Gráfico SVG representativo del cruce entre Costos Totales e Ingresos */}
          <Svg width="240" height="76" viewBox="0 0 240 76">
            {/* Línea punteada bordó: Costos Totales */}
            <Line
              x1="12"
              y1="52"
              x2="228"
              y2="24"
              stroke="#7f1d1d"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
            {/* Línea sólida azul oscuro: Ingresos por Ventas */}
            <Line
              x1="12"
              y1="66"
              x2="228"
              y2="10"
              stroke="#0f172a"
              strokeWidth="2.2"
            />
            {/* Punto celeste de intersección: Punto de equilibrio */}
            <Circle
              cx="106"
              cy="40"
              r="4.5"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          </Svg>
        </View>

        {/* PIE DE PÁGINA 1 */}
        <View style={styles.footer}>
          <Text>
            Calculado con Preciar. Es una referencia, no un asesoramiento
            contable.
          </Text>
          <Text>Página 1 de {totalPaginas}</Text>
        </View>
      </Page>

      {/* =====================================================================
          PÁGINA 2: COMPARATIVA DE ESCENARIOS (SOLO SI EL USUARIO SIMULÓ ESCENARIOS)
         ===================================================================== */}
      {escenarios.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.brandLogo}>Preciar</Text>
            <View style={styles.headerInfo}>
              <Text style={styles.headerKicker}>
                ANÁLISIS DETALLADO · CUENTA: {usuarioEmail}
              </Text>
              <Text style={styles.productTitle}>
                Escenarios de {datos.nombreProducto}
              </Text>
              <Text style={styles.headerMeta}>
                Comparativa frente a tu situación base actual ({fecha})
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            Comparativa de escenarios simulados
          </Text>
          <View style={styles.tableHeader}>
            <Text style={styles.colName}>Escenario</Text>
            <Text style={styles.colNum}>Costo unit.</Text>
            <Text style={styles.colNum}>Precio venta</Text>
            <Text style={styles.colNum}>Ganancia mes</Text>
            <Text style={styles.colNum}>Variación</Text>
          </View>
          {escenarios.map((esc, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colName}>{esc.nombre}</Text>
              <Text style={styles.colNum}>{fmtEntero(esc.costoUnitario)}</Text>
              <Text style={styles.colNum}>{fmtEntero(esc.precioVenta)}</Text>
              <Text style={styles.colNum}>{fmtEntero(esc.gananciaMensual)}</Text>
              <Text style={styles.colNum}>
                {esc.variacionPorcentualGanancia > 0 ? "+" : ""}
                {String(esc.variacionPorcentualGanancia).replace(".", ",")}%
              </Text>
            </View>
          ))}

          {/* PIE DE PÁGINA 2 */}
          <View style={styles.footer}>
            <Text>
              Calculado con Preciar. Es una referencia, no un asesoramiento
              contable.
            </Text>
            <Text>Página 2 de {totalPaginas}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}