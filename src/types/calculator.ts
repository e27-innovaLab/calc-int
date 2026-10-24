import {Decimal} from "decimal.js";

//Sincronizacion exacta con frontend
// Mapeamos la estructura Calculo que viene de la UI a los DTOs de entrada y salida del motor de cálculo.

export type DecimalString = string;

export interface ConfiguracionInput {
  tipo: "producto" | "servicio";
  nombre: string;
  moneda: "ARS" | "USD";
  periodo: "semanal" | "mensual" | "anual";
  unidadVenta: string;
  volumenEstimado: DecimalString;
}

export interface ConceptoCostoInput {
  id: string;
  nombre: string;
  montoPeriodo?: DecimalString;  // Para fijos
  montoUnitario?: DecimalString; // Para variables
  monto?: DecimalString;         // Para indirectos
  base?: "periodo" | "unidad";   // Para indirectos
}

export interface TrabajoPropioInput {
  incluir: boolean;
  horasPeriodo: DecimalString;
  valorHora: DecimalString;
}

export interface CalculoInputDTO {
  configuracion: ConfiguracionInput;
  costosFijos: ConceptoCostoInput[];
  costosVariables: ConceptoCostoInput[];
  costosIndirectos: ConceptoCostoInput[];
  trabajoPropio: TrabajoPropioInput;
}

export interface ResultadoCostosDTO {
  totalCostosFijos: DecimalString;
  costoVariableUnitario: DecimalString;
  totalIndirectosPeriodo: DecimalString;
  totalTrabajoPropio: DecimalString;
  costoTotalPeriodo: DecimalString;
  costoUnitario: DecimalString;
}