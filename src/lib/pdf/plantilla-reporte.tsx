import React from "react";
import {Document,Page,Text,View,StyleSheet,Svg,Line,Circle,Rect,} from "@react-pdf/renderer";
import Decimal from "decimal.js";
import type { z } from "zod";
import { esquemaCalculo } from "@/server/calculos/esquema";
import type { ResumenCostos } from "@/domain/motor/costos";
import type {ComposicionCostoUnitario,DetalleCostos,} from "@/domain/motor/resumen";
import type {AnalisisPrecio,DatosGrafico,NivelMargen,} from "@/domain/motor/precio";
import type { Situacion } from "@/domain/motor/escenarios";
import {formatearCantidad,formatearDiferenciaMonto,formatearDiferenciaPuntos,formatearDiferenciaUnidades,formatearMonto,formatearPorcentaje,formatearUnidades,} from "@/lib/formato";

type CalculateRequest = z.infer<typeof esquemaCalculo>;

// ============================================================================
// TIPOS EXPORTADOS PARA EL ENDPOINT
// ============================================================================

export interface EscenarioCalculadoPdf {
  id: string;
  nombre: string;
  insumosPct: string;
  precioPct: string;
  produccionPct: string;
  situacion: Situacion;
  deltas: {
    costoUnitario: string;
    precio: string;
    margenPts: string;
    equilibrioUds: string | null;
    ganancia: string;
  };
}

export interface DatosReportePdf {
  usuarioEmail: string;
  fecha: string;
  calculo: CalculateRequest;
  resumen: ResumenCostos;
  costoTotalLote: string | null;
  composicion: ComposicionCostoUnitario;
  detalle: DetalleCostos;
  analisis: AnalisisPrecio;
  nivelMargen: NivelMargen | null;
  graficoEquilibrio: DatosGrafico;
  base: Situacion;
  escenarios: EscenarioCalculadoPdf[];
  metaVentasMensual: string | null;
}

// ============================================================================
// PALETA DE COLORES Y ESTILOS (@react-pdf/renderer)
// ============================================================================

const C = {
  navy: "#0f172a",
  navyCard: "#111c33",
  navyPill: "#1e293b",
  sky: "#38bdf8",
  skySoft: "#e0f2fe",
  skyCard: "#dbeafe",
  green: "#15803d",
  greenBg: "#dcfce7",
  greenSoft: "#eefbf3",
  red: "#b91c1c",
  redBg: "#fee2e2",
  redSoft: "#fef2f2",
  beige: "#f5efe6",
  slate900: "#0f172a",
  slate700: "#334155",
  slate500: "#64748b",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  white: "#ffffff",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: C.slate900,
    paddingBottom: 42,
  },
  bodyPad: {
    paddingHorizontal: 32,
    paddingTop: 18,
  },

  // --- ENCABEZADO HERO PÁGINA 1 ---
  heroHeader: {
    backgroundColor: C.navy,
    paddingHorizontal: 32,
    paddingTop: 22,
    paddingBottom: 20,
    color: C.white,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandPreci: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  brandAr: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.sky,
  },
  heroDate: {
    fontSize: 9,
    color: C.slate300,
  },
  heroProduct: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginBottom: 12,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  heroPill: {
    backgroundColor: C.navyPill,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#334155",
  },
  heroPillText: {
    fontSize: 8.5,
    color: C.slate200,
  },

  // --- ENCABEZADO COMPACTO PÁGINAS 2, 3 Y 4 ---
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
  },
  subBrandPreci: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },
  subBrandAr: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.sky,
  },
  subMeta: {
    fontSize: 8.5,
    color: C.slate500,
  },

  // --- PÁGINA 1: BARRA SITUACIÓN ACTUAL ---
  situacionBox: {
    backgroundColor: C.navyCard,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  situacionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  situacionKicker: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.slate300,
    letterSpacing: 0.6,
  },
  situacionProd: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  situacionCols: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  situacionCol: {
    width: "19%",
  },
  situacionLabel: {
    fontSize: 7.5,
    color: C.slate300,
    marginBottom: 3,
  },
  situacionVal: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },

  // --- PÁGINA 1: 3 TARJETAS DE COSTO ---
  costCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },
  costCardDark: {
    width: "34%",
    backgroundColor: C.navyCard,
    borderRadius: 10,
    padding: 12,
    color: C.white,
  },
  costCardLight: {
    width: "31%",
    backgroundColor: C.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: C.slate200,
  },
  cardKickerLight: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.slate300,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardKickerDark: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.slate500,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardValLight: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginBottom: 2,
  },
  cardValDark: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    marginBottom: 2,
  },
  cardSubLight: {
    fontSize: 7.5,
    color: C.slate300,
    marginBottom: 8,
  },
  cardSubDark: {
    fontSize: 8,
    color: C.slate500,
  },
  formulaBox: {
    backgroundColor: C.skySoft,
    borderRadius: 6,
    padding: 7,
  },
  formulaText: {
    fontSize: 7.2,
    color: C.navy,
    lineHeight: 1.35,
  },
  formulaBold: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    marginTop: 2,
  },

  // --- PÁGINA 1: COMPOSICIÓN DEL COSTO ---
  boxCard: {
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  boxTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    marginBottom: 10,
  },
  compRow: {
    marginBottom: 9,
  },
  compHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  compLabel: {
    fontSize: 8.5,
    color: C.slate700,
  },
  compVal: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },
  trackBar: {
    height: 7,
    backgroundColor: C.slate100,
    borderRadius: 4,
    overflow: "hidden",
  },

  // --- PÁGINA 2: DETALLE DE COSTOS ---
  catHeader: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.slate500,
    letterSpacing: 0.6,
    marginTop: 8,
    marginBottom: 4,
  },
  detailLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: C.slate200,
  },
  detailTotalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    marginBottom: 4,
  },
  detailName: {
    fontSize: 8.5,
    color: C.slate700,
  },
  detailAmount: {
    fontSize: 8.5,
    color: C.slate900,
  },
  detailTotalText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },

  // --- PÁGINA 2: MARGEN Y PRECIO SUGERIDO ---
  margenTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  margenBigPct: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },
  diagText: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  suggestedPriceCard: {
    backgroundColor: C.skyCard,
    borderRadius: 8,
    padding: 12,
  },
  suggestedLabel: {
    fontSize: 8,
    color: C.slate700,
    marginBottom: 2,
  },
  suggestedPrice: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },

  // --- PÁGINA 3: CONTRIBUCIÓN Y PROYECCIÓN ---
  contribCard: {
    backgroundColor: C.greenBg,
    borderRadius: 10,
    padding: 13,
    marginBottom: 10,
  },
  contribKicker: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.green,
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  contribMainRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
    marginBottom: 2,
  },
  contribBig: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.green,
  },
  contribUnit: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.green,
  },
  contribSub: {
    fontSize: 8,
    color: C.green,
  },

  // --- PÁGINA 3: TARJETA PUNTO DE EQUILIBRIO ---
  beDarkCard: {
    backgroundColor: C.navyCard,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    color: C.white,
  },
  beTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  beBigUnits: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginVertical: 2,
  },
  beBadgeOk: {
    backgroundColor: C.green,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  beBadgeWarn: {
    backgroundColor: C.red,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  beBadgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  beNote: {
    fontSize: 7.5,
    color: C.slate300,
    marginTop: 2,
  },
  beFooterMsg: {
    fontSize: 8,
    color: "#4ade80",
    marginTop: 8,
  },

  // --- PÁGINA 4: TABLA COMPARATIVA ESCENARIOS ---
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.slate100,
    borderBottomWidth: 1,
    borderBottomColor: C.slate300,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.6,
    borderBottomColor: C.slate200,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: "flex-start",
  },
  colEsc: { width: "25%", paddingRight: 4 },
  colMet: { width: "15%", paddingHorizontal: 2 },
  thText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.slate700,
  },
  tdTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },
  tdSub: {
    fontSize: 6.8,
    color: C.slate500,
    marginTop: 1,
  },
  tdVal: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },
  tdDelta: {
    fontSize: 6.8,
    color: C.slate700,
    marginTop: 1,
  },
  badgeMejora: {
    backgroundColor: C.greenBg,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    marginTop: 2,
    alignSelf: "flex-start",
  },
  badgeEmpeora: {
    backgroundColor: C.redBg,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    marginTop: 2,
    alignSelf: "flex-start",
  },
  badgeNeutro: {
    backgroundColor: C.slate100,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    marginTop: 2,
    alignSelf: "flex-start",
  },
  badgeTextMejora: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: C.green },
  badgeTextEmpeora: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: C.red },
  badgeTextNeutro: { fontSize: 6.5, color: C.slate500 },

  // --- PÁGINA 4: SIGUIENTES PASOS Y NOTAS ---
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  stepCard: {
    width: "32%",
    backgroundColor: C.skyCard,
    borderRadius: 8,
    padding: 9,
  },
  stepTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 7.2,
    color: C.slate700,
    lineHeight: 1.3,
  },
  notesBox: {
    backgroundColor: C.beige,
    borderRadius: 10,
    padding: 12,
  },
  notesTitle: {
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    marginBottom: 5,
  },
  noteBullet: {
    fontSize: 7.8,
    color: C.slate700,
    marginBottom: 2.5,
    lineHeight: 1.35,
  },

  // --- PIE DE PÁGINA ---
  footer: {
    position: "absolute",
    bottom: 16,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.6,
    borderTopColor: C.slate200,
    paddingTop: 6,
    fontSize: 7.5,
    color: C.slate500,
  },
});

// ============================================================================
// HELPERS VISUALES INTERNOS
// ============================================================================

function mensajeDiagnosticoMargen(nivel: NivelMargen | null): {
  texto: string;
  color: string;
} {
  switch (nivel) {
    case "muy-bajo":
      return {
        texto: "Margen muy ajustado: cualquier imprevisto o baja de ventas puede dejarte sin ganancia.",
        color: C.red,
      };
    case "bajo":
      return {
        texto: "Margen moderado: cubre costos, pero deja poco colchón ante subas de insumos.",
        color: "#b45309",
      };
    case "bueno":
      return {
        texto: "Buen margen para sostener el negocio y tener colchón para imprevistos.",
        color: C.green,
      };
    case "alto":
      return {
        texto: "Margen amplio: te da mucha holgura financiera; verificá que sea competitivo en tu mercado.",
        color: C.green,
      };
    default:
      return {
        texto: "Revisá el equilibrio entre precio competitivo y rentabilidad mensual.",
        color: C.slate700,
      };
  }
}

function SubHeader({ producto, fecha }: { producto: string; fecha: string }) {
  return (
    <View style={styles.subHeader}>
      <View style={styles.brandRow}>
        <Text style={styles.subBrandPreci}>Preci</Text>
        <Text style={styles.subBrandAr}>ar</Text>
      </View>
      <Text style={styles.subMeta}>
        {producto} · {fecha}
      </Text>
    </View>
  );
}

function PageFooter({ pagina }: { pagina: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text>preciar · Una forma clara de ponerle precio a lo que hacés</Text>
      <Text>Página {pagina} de 4</Text>
    </View>
  );
}

function BadgeDelta({
  tipo,
}: {
  tipo: "mejora" | "empeora" | "neutro";
}) {
  if (tipo === "mejora") {
    return (
      <View style={styles.badgeMejora}>
        <Text style={styles.badgeTextMejora}>✓ Mejora</Text>
      </View>
    );
  }
  if (tipo === "empeora") {
    return (
      <View style={styles.badgeEmpeora}>
        <Text style={styles.badgeTextEmpeora}>▲ Empeora</Text>
      </View>
    );
  }
  return (
    <View style={styles.badgeNeutro}>
      <Text style={styles.badgeTextNeutro}>— Sin cambios</Text>
    </View>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL DEL REPORTE (4 PÁGINAS A4)
// ============================================================================

export function crearDocumentoReportePdf(data: DatosReportePdf) {
  const {
    fecha,
    calculo,
    resumen,
    costoTotalLote,
    composicion,
    detalle,
    analisis,
    nivelMargen,
    graficoEquilibrio,
    base,
    escenarios,
    metaVentasMensual,
  } = data;

  const { configuracion, precio } = calculo;
  const nombreProducto = configuracion.nombre.trim() || "Producto sin nombre";
  const esLotes = configuracion.ruta === "lotes";

  const etiquetaModalidad =
    configuracion.ruta === "lotes"
      ? "Modalidad: por lotes"
      : configuracion.ruta === "reventa"
        ? "Modalidad: reventa"
        : "Modalidad: por unidad";

  const etiquetaVolumen = esLotes
    ? `${formatearUnidades(configuracion.unidadesPorLote)} · ${formatearCantidad(configuracion.lotes)} lotes = ${formatearCantidad(resumen.volumenMensual)} por mes`
    : `${formatearUnidades(resumen.volumenMensual)} por mes`;

  // Composición de costos Página 1
  const partidasComposicion = [
    {
      nombre: "Trabajo propio",
      monto: composicion.trabajoPropio.porUnidad,
      pct: composicion.trabajoPropio.porcentaje,
      color: C.navy,
    },
    {
      nombre: "Gastos fijos",
      monto: composicion.gastosFijos.porUnidad,
      pct: composicion.gastosFijos.porcentaje,
      color: C.green,
    },
    {
      nombre: "Costos indirectos",
      monto: composicion.indirectos.porUnidad,
      pct: composicion.indirectos.porcentaje,
      color: C.sky,
    },
    {
      nombre: "Materiales / insumos",
      monto: composicion.materiales.porUnidad,
      pct: composicion.materiales.porcentaje,
      color: "#78350f",
    },
  ];

  // Totales de detalle Página 2
  const totalGastosFijos = detalle.gastosFijos
    .reduce((acc, item) => acc.plus(item.monto), new Decimal(0))
    .toString();
  const totalIndirectos = detalle.indirectos
    .reduce((acc, item) => acc.plus(item.monto), new Decimal(0))
    .toString();
  const totalVariables = detalle.variables
    .reduce((acc, item) => acc.plus(item.monto), new Decimal(0))
    .toString();

  const diagMargen = mensajeDiagnosticoMargen(nivelMargen);

  // Coordenadas dinámicas para SVG Punto de Equilibrio (Página 3)
  const svgW = 460;
  const svgH = 145;
  const padL = 48;
  const padR = 38;
  const padT = 14;
  const padB = 22;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const maxU = Math.max(graficoEquilibrio.maxUnidades, 1);
  const maxImp = Math.max(graficoEquilibrio.maxImporte, 1);
  const mapX = (u: number) => padL + (u / maxU) * plotW;
  const mapY = (imp: number) => padT + plotH - (imp / maxImp) * plotH;

  const [pIni, pFin] = graficoEquilibrio.puntos;
  const x0 = mapX(pIni.unidades);
  const yIng0 = mapY(pIni.ingresos);
  const yCos0 = mapY(pIni.costos);
  const x1 = mapX(pFin.unidades);
  const yIng1 = mapY(pFin.ingresos);
  const yCos1 = mapY(pFin.costos);

  const cruceU = graficoEquilibrio.cruce ?? 0;
  const xCruce = Math.min(Math.max(mapX(cruceU), padL), padL + plotW);
  const yCruce = mapY(Number(analisis.precio) * cruceU);
  const volActualNum = Number(resumen.volumenMensual ?? 0);
  const xVolActual = Math.min(Math.max(mapX(volActualNum), padL), padL + plotW);

  // Escala para gráfico de barras Ganancia Mensual (Página 4)
  const filasGanancia = [
    {
      nombre: "Situación actual",
      valor: Number(base.gananciaMensual),
      texto: formatearMonto(base.gananciaMensual),
      esBase: true,
    },
    ...escenarios.map((e) => ({
      nombre: e.nombre,
      valor: Number(e.situacion.gananciaMensual),
      texto: formatearMonto(e.situacion.gananciaMensual),
      esBase: false,
    })),
  ];
  const maxGanancia = Math.max(
    ...filasGanancia.map((f) => Math.max(f.valor, 0)),
    1,
  );
  const baseGananciaPct = Math.min(
    100,
    Math.max(0, (Math.max(Number(base.gananciaMensual), 0) / maxGanancia) * 100),
  );

  // Mejor escenario por ganancia
  let idMejorGanancia: string | null = null;
  let maxGananciaEsc = new Decimal(base.gananciaMensual);
  for (const e of escenarios) {
    const g = new Decimal(e.situacion.gananciaMensual);
    if (g.greaterThan(maxGananciaEsc)) {
      maxGananciaEsc = g;
      idMejorGanancia = e.id;
    }
  }

  return (
    <Document>
      {/* =====================================================================
          PÁGINA 1: ENCABEZADO + SITUACIÓN ACTUAL + TARJETAS COSTO + COMPOSICIÓN
         ===================================================================== */}
      <Page size="A4" style={styles.page}>
        {/* Encabezado oscuro principal (NUEVO) */}
        <View style={styles.heroHeader}>
          <View style={styles.heroTopRow}>
            <View style={styles.brandRow}>
              <Text style={styles.brandPreci}>Preci</Text>
              <Text style={styles.brandAr}>ar</Text>
            </View>
            <Text style={styles.heroDate}>Informe de precio · {fecha}</Text>
          </View>

          <Text style={styles.heroProduct}>{nombreProducto}</Text>

          <View style={styles.pillsRow}>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>{etiquetaModalidad}</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>{etiquetaVolumen}</Text>
            </View>
            <View style={styles.heroPill}>
              <Text style={styles.heroPillText}>Pesos argentinos · mensual</Text>
            </View>
          </View>
        </View>

        <View style={styles.bodyPad}>
          {/* Barra Situación actual (Paso 5) */}
          <View style={styles.situacionBox}>
            <View style={styles.situacionTop}>
              <Text style={styles.situacionKicker}>SITUACIÓN ACTUAL (BASE)</Text>
              <Text style={styles.situacionProd}>{nombreProducto}</Text>
            </View>
            <View style={styles.situacionCols}>
              <View style={styles.situacionCol}>
                <Text style={styles.situacionLabel}>Costo unitario</Text>
                <Text style={styles.situacionVal}>
                  {formatearMonto(base.costoUnitario)}
                </Text>
              </View>
              <View style={styles.situacionCol}>
                <Text style={styles.situacionLabel}>Precio de venta</Text>
                <Text style={styles.situacionVal}>
                  {formatearMonto(base.precio)}
                </Text>
              </View>
              <View style={styles.situacionCol}>
                <Text style={styles.situacionLabel}>Margen neto</Text>
                <Text style={styles.situacionVal}>
                  {formatearPorcentaje(base.margenNetoPct)}
                </Text>
              </View>
              <View style={styles.situacionCol}>
                <Text style={styles.situacionLabel}>Punto de equilibrio</Text>
                <Text style={styles.situacionVal}>
                  {base.puntoEquilibrio
                    ? `${formatearCantidad(base.puntoEquilibrio)} uds`
                    : "—"}
                </Text>
              </View>
              <View style={styles.situacionCol}>
                <Text style={styles.situacionLabel}>Ganancia mensual</Text>
                <Text style={styles.situacionVal}>
                  {formatearMonto(base.gananciaMensual)}
                </Text>
              </View>
            </View>
          </View>

          {/* 3 Tarjetas de costo (Paso 3) con fórmula abierta */}
          <View style={styles.costCardsRow}>
            <View style={styles.costCardDark}>
              <Text style={styles.cardKickerLight}>COSTO UNITARIO REAL</Text>
              <Text style={styles.cardValLight}>
                {formatearMonto(resumen.costoUnitario)}
              </Text>
              <Text style={styles.cardSubLight}>
                lo que te cuesta hacer una sola unidad
              </Text>
              <View style={styles.formulaBox}>
                <Text style={styles.formulaText}>
                  (Costo fijo / mes ÷ unidades) + variables
                </Text>
                <Text style={styles.formulaBold}>
                  ({formatearMonto(resumen.costoFijoTotalMensual)} ÷{" "}
                  {formatearCantidad(resumen.volumenMensual)}) +{" "}
                  {formatearMonto(resumen.costoVariableUnitario)} ={" "}
                  {formatearMonto(resumen.costoUnitario)}
                </Text>
              </View>
            </View>

            <View style={styles.costCardLight}>
              <Text style={styles.cardKickerDark}>
                {esLotes ? "COSTO TOTAL POR LOTE" : "COSTO FIJO MENSUAL"}
              </Text>
              <Text style={styles.cardValDark}>
                {esLotes
                  ? formatearMonto(costoTotalLote)
                  : formatearMonto(resumen.costoFijoTotalMensual)}
              </Text>
              <Text style={styles.cardSubDark}>
                {esLotes
                  ? `${formatearCantidad(configuracion.unidadesPorLote)} uds × ${formatearCantidad(configuracion.lotes)} lotes`
                  : "estructura fija del mes"}
              </Text>
            </View>

            <View style={styles.costCardLight}>
              <Text style={styles.cardKickerDark}>COSTO TOTAL MENSUAL</Text>
              <Text style={styles.cardValDark}>
                {formatearMonto(resumen.costoTotalMensual)}
              </Text>
              <Text style={styles.cardSubDark}>
                {formatearUnidades(resumen.volumenMensual)}/mes
              </Text>
            </View>
          </View>

          {/* Composición del costo unitario (Paso 3) */}
          <View style={styles.boxCard}>
            <Text style={styles.boxTitle}>Composición del costo unitario</Text>
            {partidasComposicion.map((item, i) => {
              const pctNum = Math.min(100, Math.max(0.8, Number(item.pct)));
              return (
                <View key={i} style={styles.compRow}>
                  <View style={styles.compHeader}>
                    <Text style={styles.compLabel}>{item.nombre}</Text>
                    <Text style={styles.compVal}>
                      {formatearMonto(item.monto)} (
                      {formatearPorcentaje(item.pct)})
                    </Text>
                  </View>
                  <View style={styles.trackBar}>
                    <View
                      style={{
                        width: `${pctNum}%`,
                        height: 7,
                        backgroundColor: item.color,
                        borderRadius: 4,
                      }}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <PageFooter pagina={1} />
      </Page>

      {/* =====================================================================
          PÁGINA 2: DETALLE COMPLETO DE COSTOS + MARGEN Y PRECIO SUGERIDO
         ===================================================================== */}
      <Page size="A4" style={styles.page}>
        <SubHeader producto={nombreProducto} fecha={fecha} />

        <View style={styles.bodyPad}>
          {/* Detalle completo de costos (siempre abierto, sin botón colapsar) */}
          <View style={styles.boxCard}>
            <Text style={styles.boxTitle}>Detalle completo de costos</Text>

            <Text style={styles.catHeader}>GASTOS FIJOS</Text>
            {detalle.gastosFijos.length > 0 ? (
              detalle.gastosFijos.map((g) => (
                <View key={g.id} style={styles.detailLine}>
                  <Text style={styles.detailName}>{g.nombre}</Text>
                  <Text style={styles.detailAmount}>
                    {formatearMonto(g.monto)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.detailLine}>
                <Text style={styles.detailName}>Sin gastos fijos cargados</Text>
                <Text style={styles.detailAmount}>$0</Text>
              </View>
            )}
            <View style={styles.detailTotalLine}>
              <Text style={styles.detailTotalText}>Total</Text>
              <Text style={styles.detailTotalText}>
                {formatearMonto(totalGastosFijos)}
              </Text>
            </View>

            <Text style={styles.catHeader}>COSTOS INDIRECTOS</Text>
            {detalle.indirectos.length > 0 ? (
              detalle.indirectos.map((ind) => (
                <View key={ind.id} style={styles.detailLine}>
                  <Text style={styles.detailName}>{ind.nombre}</Text>
                  <Text style={styles.detailAmount}>
                    {formatearMonto(ind.monto)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.detailLine}>
                <Text style={styles.detailName}>Sin costos indirectos</Text>
                <Text style={styles.detailAmount}>$0</Text>
              </View>
            )}
            <View style={styles.detailTotalLine}>
              <Text style={styles.detailTotalText}>Total</Text>
              <Text style={styles.detailTotalText}>
                {formatearMonto(totalIndirectos)}
              </Text>
            </View>

            <Text style={styles.catHeader}>COSTOS VARIABLES POR UNIDAD</Text>
            {detalle.variables.length > 0 ? (
              detalle.variables.map((v) => (
                <View key={v.id} style={styles.detailLine}>
                  <Text style={styles.detailName}>
                    {v.nombre}
                    {v.porLote
                      ? ` (${formatearMonto(v.porLote.montoLote)} ÷ ${formatearCantidad(v.porLote.unidadesPorLote)} uds)`
                      : ""}
                  </Text>
                  <Text style={styles.detailAmount}>
                    {formatearMonto(v.monto)}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.detailLine}>
                <Text style={styles.detailName}>Sin insumos cargados</Text>
                <Text style={styles.detailAmount}>$0</Text>
              </View>
            )}
            <View style={styles.detailTotalLine}>
              <Text style={styles.detailTotalText}>Total</Text>
              <Text style={styles.detailTotalText}>
                {formatearMonto(totalVariables)}
              </Text>
            </View>

            <Text style={styles.catHeader}>TRABAJO PROPIO MENSUAL</Text>
            {detalle.trabajoPropio ? (
              <View style={styles.detailTotalLine}>
                <Text style={styles.detailName}>
                  {detalle.trabajoPropio.sueldoDirecto
                    ? "Sueldo mensual asignado"
                    : `${formatearCantidad(detalle.trabajoPropio.horasPorLote)} hs × ${formatearMonto(detalle.trabajoPropio.valorHora)}/h${esLotes ? ` × ${formatearCantidad(detalle.trabajoPropio.lotes)} lotes` : ""}`}
                </Text>
                <Text style={styles.detailTotalText}>
                  {formatearMonto(detalle.trabajoPropio.totalMensual)}
                </Text>
              </View>
            ) : (
              <View style={styles.detailTotalLine}>
                <Text style={styles.detailName}>No incluido en el costo</Text>
                <Text style={styles.detailTotalText}>$0</Text>
              </View>
            )}
          </View>

          {/* Margen esperado y precio sugerido (Paso 4, sin slider ni desplegables) */}
          <View style={styles.boxCard}>
            <View style={styles.margenTopRow}>
              <Text style={styles.boxTitle}>
                {precio.modo === "margen"
                  ? "Margen esperado"
                  : "Margen resultante con tu precio"}
              </Text>
              <Text style={styles.margenBigPct}>
                {precio.modo === "margen"
                  ? formatearPorcentaje(precio.margenPct)
                  : formatearPorcentaje(analisis.margenResultantePct)}
              </Text>
            </View>

            <Text style={[styles.diagText, { color: diagMargen.color }]}>
              {diagMargen.texto}
            </Text>

            <View style={styles.suggestedPriceCard}>
              <Text style={styles.suggestedLabel}>
                {precio.modo === "margen"
                  ? "Precio sugerido por unidad"
                  : "Precio de venta ingresado por unidad"}
              </Text>
              <Text style={styles.suggestedPrice}>
                {formatearMonto(analisis.precio)}
              </Text>
            </View>
          </View>
        </View>

        <PageFooter pagina={2} />
      </Page>

      {/* =====================================================================
          PÁGINA 3: CONTRIBUCIÓN + PROYECCIÓN + EQUILIBRIO + GRÁFICO INGRESOS/COSTOS
         ===================================================================== */}
      <Page size="A4" style={styles.page}>
        <SubHeader producto={nombreProducto} fecha={fecha} />

        <View style={styles.bodyPad}>
          {/* Margen de contribución (Paso 4, sin botón fórmula) */}
          <View style={styles.contribCard}>
            <Text style={styles.contribKicker}>MARGEN DE CONTRIBUCIÓN</Text>
            <View style={styles.contribMainRow}>
              <Text style={styles.contribBig}>
                {formatearMonto(analisis.contribucion)}
              </Text>
              <Text style={styles.contribUnit}>por unidad</Text>
            </View>
            <Text style={styles.contribSub}>
              {formatearPorcentaje(analisis.contribucionPct)} del precio de venta
            </Text>
          </View>

          {/* Proyección mensual */}
          <View style={styles.boxCard}>
            <Text style={styles.catHeader}>PROYECCIÓN MENSUAL</Text>
            <View style={styles.detailLine}>
              <Text style={styles.detailName}>Ingresos totales</Text>
              <Text style={styles.detailTotalText}>
                {formatearMonto(analisis.ingresosTotalesMensual)}
              </Text>
            </View>
            <View style={styles.detailLine}>
              <Text style={styles.detailName}>Costos totales</Text>
              <Text style={styles.detailTotalText}>
                {formatearMonto(analisis.costosTotalesMensual)}
              </Text>
            </View>
            <View style={[styles.detailTotalLine, { marginBottom: 0 }]}>
              <Text style={styles.detailTotalText}>Ganancia neta</Text>
              <Text
                style={[
                  styles.detailTotalText,
                  {
                    color: new Decimal(analisis.gananciaNetaMensual).isNegative()
                      ? C.red
                      : C.green,
                  },
                ]}
              >
                {formatearMonto(analisis.gananciaNetaMensual)}
              </Text>
            </View>
          </View>

          {/* Tarjeta Punto de equilibrio (Paso 4, sin ícono ?) */}
          <View style={styles.beDarkCard}>
            <View style={styles.beTopRow}>
              <View>
                <Text style={styles.situacionKicker}>PUNTO DE EQUILIBRIO</Text>
                <Text style={styles.beBigUnits}>
                  {analisis.puntoEquilibrioUnidades
                    ? formatearUnidades(analisis.puntoEquilibrioUnidades)
                    : "Inalcanzable"}
                </Text>
              </View>
              <View
                style={
                  analisis.estado === "supera"
                    ? styles.beBadgeOk
                    : styles.beBadgeWarn
                }
              >
                <Text style={styles.beBadgeText}>
                  {analisis.estado === "supera"
                    ? "✓ Superás el equilibrio"
                    : analisis.estado === "bajo"
                      ? "Por debajo del equilibrio"
                      : "No cubre costos"}
                </Text>
              </View>
            </View>
            <Text style={styles.beNote}>
              Facturación mínima: {formatearMonto(analisis.facturacionMinima)}
            </Text>
            <Text style={styles.beNote}>
              Redondeamos hacia arriba porque no se puede vender media unidad.
            </Text>
            <Text
              style={[
                styles.beFooterMsg,
                { color: analisis.estado === "supera" ? "#4ade80" : "#fca5a5" },
              ]}
            >
              {analisis.estado === "supera"
                ? "Estás vendiendo bien por encima de tu piso. Cada unidad extra ya suma ganancia."
                : "Necesitás aumentar el volumen de ventas o mejorar el margen para cubrir tus costos fijos."}
            </Text>
          </View>

          {/* Gráfico Ingresos vs. costos totales (SVG vectorial) */}
          <View style={[styles.boxCard, { marginBottom: 0 }]}>
            <Text style={styles.boxTitle}>Ingresos vs. costos totales</Text>
            <Text style={[styles.cardSubDark, { marginBottom: 8 }]}>
              Donde se cruzan las líneas está tu punto de equilibrio.
            </Text>

            <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
              {/* Zona de pérdida (izquierda del cruce) */}
              {graficoEquilibrio.cruce !== null && (
                <Rect
                  x={padL}
                  y={padT}
                  width={Math.max(0, xCruce - padL)}
                  height={plotH}
                  fill={C.redSoft}
                />
              )}
              {/* Zona de ganancia (derecha del cruce) */}
              {graficoEquilibrio.cruce !== null && (
                <Rect
                  x={xCruce}
                  y={padT}
                  width={Math.max(0, padL + plotW - xCruce)}
                  height={plotH}
                  fill={C.greenSoft}
                />
              )}

              {/* Ejes base */}
              <Line
                x1={padL}
                y1={padT}
                x2={padL}
                y2={padT + plotH}
                stroke={C.slate300}
                strokeWidth={1}
              />
              <Line
                x1={padL}
                y1={padT + plotH}
                x2={padL + plotW}
                y2={padT + plotH}
                stroke={C.slate300}
                strokeWidth={1}
              />

              {/* Línea vertical punteada: Punto de equilibrio */}
              {graficoEquilibrio.cruce !== null && (
                <Line
                  x1={xCruce}
                  y1={padT}
                  x2={xCruce}
                  y2={padT + plotH}
                  stroke={C.green}
                  strokeWidth={1.2}
                  strokeDasharray="3 3"
                />
              )}

              {/* Línea vertical gris: Tu volumen */}
              <Line
                x1={xVolActual}
                y1={padT}
                x2={xVolActual}
                y2={padT + plotH}
                stroke={C.slate500}
                strokeWidth={1}
                strokeDasharray="2 2"
              />

              {/* Recta de Costos Totales (bordó punteada) */}
              <Line
                x1={x0}
                y1={yCos0}
                x2={x1}
                y2={yCos1}
                stroke={C.red}
                strokeWidth={2}
                strokeDasharray="4 3"
              />

              {/* Recta de Ingresos (azul oscuro sólida) */}
              <Line
                x1={x0}
                y1={yIng0}
                x2={x1}
                y2={yIng1}
                stroke={C.navy}
                strokeWidth={2}
              />

              {/* Punto de intersección */}
              {graficoEquilibrio.cruce !== null && (
                <Circle
                  cx={xCruce}
                  cy={yCruce}
                  r={4}
                  fill={C.navy}
                  stroke={C.white}
                  strokeWidth={1.2}
                />
              )}
            </Svg>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 4,
              }}
            >
              <Text style={styles.cardSubDark}>
                {analisis.puntoEquilibrioUnidades
                  ? `Con ${formatearUnidades(analisis.puntoEquilibrioUnidades)} tus ingresos igualan tus costos.`
                  : "El precio actual no alcanza a cubrir el costo variable unitario."}
              </Text>
              <Text style={styles.cardSubDark}>
                Tu volumen: {formatearCantidad(resumen.volumenMensual)} uds
              </Text>
            </View>
          </View>
        </View>

        <PageFooter pagina={3} />
      </Page>

      {/* =====================================================================
          PÁGINA 4: TABLA ESCENARIOS + GRÁFICO GANANCIA + SIGUIENTES PASOS + NOTAS
         ===================================================================== */}
      <Page size="A4" style={styles.page}>
        <SubHeader producto={nombreProducto} fecha={fecha} />

        <View style={styles.bodyPad}>
          {/* Tabla Comparación con tu situación actual (Paso 5) */}
          <View style={[styles.boxCard, { padding: 10, marginBottom: 10 }]}>
            <Text style={[styles.boxTitle, { marginBottom: 6 }]}>
              Comparación con tu situación actual
            </Text>

            <View style={styles.tableHeader}>
              <Text style={[styles.thText, styles.colEsc]}>Escenario</Text>
              <Text style={[styles.thText, styles.colMet]}>Costo unit.</Text>
              <Text style={[styles.thText, styles.colMet]}>Precio venta</Text>
              <Text style={[styles.thText, styles.colMet]}>Margen neto</Text>
              <Text style={[styles.thText, styles.colMet]}>Equilibrio</Text>
              <Text style={[styles.thText, styles.colMet]}>Ganancia mes</Text>
            </View>

            {/* Fila Situación Base */}
            <View style={styles.tableRow}>
              <View style={styles.colEsc}>
                <Text style={styles.tdTitle}>Situación actual (base)</Text>
                <Text style={styles.tdSub}>Costos 0% · Precio 0% · Vol. 0%</Text>
              </View>
              <View style={styles.colMet}>
                <Text style={styles.tdVal}>
                  {formatearMonto(base.costoUnitario)}
                </Text>
                <BadgeDelta tipo="neutro" />
              </View>
              <View style={styles.colMet}>
                <Text style={styles.tdVal}>{formatearMonto(base.precio)}</Text>
                <BadgeDelta tipo="neutro" />
              </View>
              <View style={styles.colMet}>
                <Text style={styles.tdVal}>
                  {formatearPorcentaje(base.margenNetoPct)}
                </Text>
                <BadgeDelta tipo="neutro" />
              </View>
              <View style={styles.colMet}>
                <Text style={styles.tdVal}>
                  {base.puntoEquilibrio
                    ? `${formatearCantidad(base.puntoEquilibrio)} uds`
                    : "—"}
                </Text>
                <BadgeDelta tipo="neutro" />
              </View>
              <View style={styles.colMet}>
                <Text style={styles.tdVal}>
                  {formatearMonto(base.gananciaMensual)}
                </Text>
                <BadgeDelta tipo="neutro" />
              </View>
            </View>

            {/* Filas de Escenarios Simulados */}
            {escenarios.map((esc) => {
              const dCosto = new Decimal(esc.deltas.costoUnitario);
              const dPrecio = new Decimal(esc.deltas.precio);
              const dMargen = new Decimal(esc.deltas.margenPts);
              const dEq = esc.deltas.equilibrioUds
                ? new Decimal(esc.deltas.equilibrioUds)
                : new Decimal(0);
              const dGan = new Decimal(esc.deltas.ganancia);

              return (
                <View key={esc.id} style={styles.tableRow}>
                  <View style={styles.colEsc}>
                    <Text style={styles.tdTitle}>{esc.nombre}</Text>
                    <Text style={styles.tdSub}>
                      Costos {esc.insumosPct || "0"}% · Precio{" "}
                      {esc.precioPct || "0"}% · Vol. {esc.produccionPct || "0"}%
                    </Text>
                    {esc.id === idMejorGanancia && (
                      <View style={styles.badgeMejora}>
                        <Text style={styles.badgeTextMejora}>Mayor ganancia</Text>
                      </View>
                    )}
                  </View>

                  {/* Costo unitario (bajar es mejora) */}
                  <View style={styles.colMet}>
                    <Text style={styles.tdVal}>
                      {formatearMonto(esc.situacion.costoUnitario)}
                    </Text>
                    {!dCosto.isZero() && (
                      <Text style={styles.tdDelta}>
                        {formatearDiferenciaMonto(esc.deltas.costoUnitario)}
                      </Text>
                    )}
                    <BadgeDelta
                      tipo={
                        dCosto.isZero()
                          ? "neutro"
                          : dCosto.isNegative()
                            ? "mejora"
                            : "empeora"
                      }
                    />
                  </View>

                  {/* Precio venta */}
                  <View style={styles.colMet}>
                    <Text style={styles.tdVal}>
                      {formatearMonto(esc.situacion.precio)}
                    </Text>
                    {!dPrecio.isZero() && (
                      <Text style={styles.tdDelta}>
                        {formatearDiferenciaMonto(esc.deltas.precio)}
                      </Text>
                    )}
                    <BadgeDelta
                      tipo={
                        dPrecio.isZero()
                          ? "neutro"
                          : dPrecio.greaterThan(0)
                            ? "mejora"
                            : "empeora"
                      }
                    />
                  </View>

                  {/* Margen neto */}
                  <View style={styles.colMet}>
                    <Text style={styles.tdVal}>
                      {formatearPorcentaje(esc.situacion.margenNetoPct)}
                    </Text>
                    {!dMargen.isZero() && (
                      <Text style={styles.tdDelta}>
                        {formatearDiferenciaPuntos(esc.deltas.margenPts)}
                      </Text>
                    )}
                    <BadgeDelta
                      tipo={
                        dMargen.isZero()
                          ? "neutro"
                          : dMargen.greaterThan(0)
                            ? "mejora"
                            : "empeora"
                      }
                    />
                  </View>

                  {/* Punto de equilibrio (bajar es mejora) */}
                  <View style={styles.colMet}>
                    <Text style={styles.tdVal}>
                      {esc.situacion.puntoEquilibrio
                        ? `${formatearCantidad(esc.situacion.puntoEquilibrio)} uds`
                        : "—"}
                    </Text>
                    {esc.deltas.equilibrioUds && !dEq.isZero() && (
                      <Text style={styles.tdDelta}>
                        {formatearDiferenciaUnidades(esc.deltas.equilibrioUds)}
                      </Text>
                    )}
                    <BadgeDelta
                      tipo={
                        !esc.deltas.equilibrioUds || dEq.isZero()
                          ? "neutro"
                          : dEq.isNegative()
                            ? "mejora"
                            : "empeora"
                      }
                    />
                  </View>

                  {/* Ganancia mensual */}
                  <View style={styles.colMet}>
                    <Text style={styles.tdVal}>
                      {formatearMonto(esc.situacion.gananciaMensual)}
                    </Text>
                    {!dGan.isZero() && (
                      <Text style={styles.tdDelta}>
                        {formatearDiferenciaMonto(esc.deltas.ganancia)}
                      </Text>
                    )}
                    <BadgeDelta
                      tipo={
                        dGan.isZero()
                          ? "neutro"
                          : dGan.greaterThan(0)
                            ? "mejora"
                            : "empeora"
                      }
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Gráfico de barras horizontales: Ganancia mensual */}
          <View style={[styles.boxCard, { padding: 10, marginBottom: 10 }]}>
            <Text style={[styles.boxTitle, { marginBottom: 2 }]}>
              Ganancia mensual
            </Text>
            <Text style={[styles.cardSubDark, { marginBottom: 8 }]}>
              La línea punteada marca el valor de tu situación actual.
            </Text>

            {filasGanancia.map((fila, i) => {
              const ancho = Math.min(
                100,
                Math.max(2, (Math.max(fila.valor, 0) / maxGanancia) * 100),
              );
              return (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 5,
                  }}
                >
                  <Text style={{ width: "22%", fontSize: 7.5, color: C.slate700 }}>
                    {fila.nombre}
                  </Text>
                  <View
                    style={{
                      width: "62%",
                      height: 10,
                      backgroundColor: C.slate100,
                      borderRadius: 4,
                      position: "relative",
                    }}
                  >
                    <View
                      style={{
                        width: `${ancho}%`,
                        height: 10,
                        backgroundColor: fila.esBase ? C.navy : C.sky,
                        borderRadius: 4,
                      }}
                    />
                    {/* Marcador vertical de referencia base */}
                    <View
                      style={{
                        position: "absolute",
                        left: `${baseGananciaPct}%`,
                        top: -2,
                        bottom: -2,
                        width: 1.5,
                        backgroundColor: C.navy,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      width: "16%",
                      textAlign: "right",
                      fontSize: 7.8,
                      fontFamily: "Helvetica-Bold",
                      color: C.navy,
                    }}
                  >
                    {fila.texto}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ¿Cuál es el siguiente paso? (3 tarjetas celestes) */}
          <View style={[styles.boxCard, { padding: 10, marginBottom: 10 }]}>
            <Text style={[styles.boxTitle, { marginBottom: 6 }]}>
              ¿Cuál es el siguiente paso?
            </Text>
            <View style={styles.stepsRow}>
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>Fijar mi precio con confianza</Text>
                <Text style={styles.stepDesc}>
                  Ya tenés todos los datos para salir al mercado con un precio
                  fundamentado.
                </Text>
              </View>
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>
                  Establecer una meta de ventas mensual
                </Text>
                <Text style={styles.stepDesc}>
                  {metaVentasMensual
                    ? `Apuntá a vender al menos ${formatearUnidades(metaVentasMensual)}/mes para tener ganancia real.`
                    : "Definí una meta mensual por encima de tu punto de equilibrio."}
                </Text>
              </View>
              <View style={styles.stepCard}>
                <Text style={styles.stepTitle}>Revisar costos cada 3 meses</Text>
                <Text style={styles.stepDesc}>
                  Los precios cambian. Actualizá este cálculo cuando cambien tus
                  insumos o tu tarifa.
                </Text>
              </View>
            </View>
          </View>

          {/* Recuadro final NUEVO: Cómo leer este informe */}
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Cómo leer este informe</Text>
            <Text style={styles.noteBullet}>
              • Costo por unidad = costos fijos del mes ÷ unidades del mes +
              costo variable por unidad.
            </Text>
            <Text style={styles.noteBullet}>
              • Precio sugerido = costo por unidad ÷ (1 − margen). Punto de
              equilibrio redondeado hacia arriba.
            </Text>
            <Text style={styles.noteBullet}>
              • Los resultados salen de los datos que cargaste y valen para la
              fecha de arriba. Preciar es una ayuda para decidir y no reemplaza
              a un contador.
            </Text>
          </View>
        </View>

        <PageFooter pagina={4} />
      </Page>
    </Document>
  );
}