import { describe, it, expect, beforeEach } from 'vitest';
import { FinancialCalculatorService } from './calculator.js';
import { CalculoInputDTO } from '../types/calculator.js';

describe('FinancialCalculatorService (Semanas 1 & 2)', () => {
  let service: FinancialCalculatorService;

  beforeEach(() => {
    service = new FinancialCalculatorService();
  });

  describe('Regla 1: Tratamiento de DecimalString e Importes Base', () => {
    it('debe sumar correctamente importes en string y retornar cadenas exactas', () => {
      const input: CalculoInputDTO = {
        configuracion: {
          tipo: 'producto',
          nombre: 'Torta de Chocolate',
          moneda: 'ARS',
          periodo: 'mensual',
          unidadVenta: 'unidades',
          volumenEstimado: '24',
        },
        costosFijos: [{ id: '1', nombre: 'Alquiler', montoPeriodo: '120000' }],
        costosVariables: [{ id: '2', nombre: 'Harina y Chocolate', montoUnitario: '1500' }],
        costosIndirectos: [],
        trabajoPropio: {
          incluir: false,
          horasPeriodo: '0',
          valorHora: '0',
        },
      };

      const result = service.calculateCosts(input);

      // Costo Fijo = 120000
      expect(result.totalCostosFijos).toBe('120000');
      // Costo Variable Unitario = 1500
      expect(result.costoVariableUnitario).toBe('1500');
      // Costo Total del Período = 120000 + (1500 * 24) = 156000
      expect(result.costoTotalPeriodo).toBe('156000');
      // Costo Unitario = 156000 / 24 = 6500
      expect(result.costoUnitario).toBe('6500');
    });
  });

  describe('Regla 2: Mano de Obra Propia como Costo Fijo Mensual', () => {
    it('debe consolidar la mano de obra propia dentro de los Costos Fijos Totales (CFT)', () => {
      const input: CalculoInputDTO = {
        configuracion: {
          tipo: 'producto',
          nombre: 'Remera Estampada',
          moneda: 'ARS',
          periodo: 'mensual',
          unidadVenta: 'prendas',
          volumenEstimado: '40',
        },
        costosFijos: [
          { id: 'f1', nombre: 'Alquiler Taller', montoPeriodo: '100000' },
          { id: 'f2', nombre: 'Servicios', montoPeriodo: '20000' },
        ],
        costosVariables: [
          { id: 'v1', nombre: 'Tela y Tintas', montoUnitario: '3000' },
        ],
        costosIndirectos: [
          { id: 'i1', nombre: 'Empaque general', monto: '500', base: 'unidad' },
        ],
        trabajoPropio: {
          incluir: true,
          horasPeriodo: '20', // 20 horas en el período
          valorHora: '2000',  // $2.000 / hora
        },
      };

      const result = service.calculateCosts(input);

      // Total Trabajo Propio = 20 hrs * $2.000 = $40.000
      expect(result.totalTrabajoPropio).toBe('40000');

      // Costo Fijo Total = $100.000 + $20.000 + $40.000 (Mano de Obra) = $160.000
      expect(result.totalCostosFijos).toBe('160000');

      // Costo Variable Unitario solo incluye Tela/Tintas ($3.000)
      expect(result.costoVariableUnitario).toBe('3000');

      // Costos Indirectos Totales = $500 * 40 unidades = $20.000
      expect(result.totalIndirectosPeriodo).toBe('20000');

      // Costo Total Período = 160000 (Fijos) + (3000 * 40) (Variables) + 20000 (Indirectos) = 300000
      expect(result.costoTotalPeriodo).toBe('300000');

      // Costo Unitario = 300000 / 40 = 7500
      expect(result.costoUnitario).toBe('7500');
    });

    it('no debe alterar el Costo Variable Unitario si se habilita o inhabilita el trabajo propio', () => {
      const baseInput: CalculoInputDTO = {
        configuracion: {
          tipo: 'producto',
          nombre: 'Artesanía de Cerámica',
          moneda: 'ARS',
          periodo: 'mensual',
          unidadVenta: 'piezas',
          volumenEstimado: '10',
        },
        costosFijos: [{ id: 'f1', nombre: 'Internet y Servicios', montoPeriodo: '15000' }],
        costosVariables: [{ id: 'v1', nombre: 'Arcilla y Esmalte', montoUnitario: '1200' }],
        costosIndirectos: [],
        trabajoPropio: {
          incluir: true,
          horasPeriodo: '6',
          valorHora: '1500',
        },
      };

      const resultWithLabor = service.calculateCosts(baseInput);

      const inputWithoutLabor: CalculoInputDTO = {
        ...baseInput,
        trabajoPropio: {
          incluir: false,
          horasPeriodo: '6',
          valorHora: '1500',
        },
      };
      const resultWithoutLabor = service.calculateCosts(inputWithoutLabor);

      // El Costo Variable Unitario debe ser exactamente el mismo ("1200")
      expect(resultWithLabor.costoVariableUnitario).toBe('1200');
      expect(resultWithoutLabor.costoVariableUnitario).toBe('1200');

      // El CFT aumenta en la prueba con mano de obra (6 * 1500 = $9.000)
      expect(resultWithLabor.totalCostosFijos).toBe('24000'); // 15000 + 9000
      expect(resultWithoutLabor.totalCostosFijos).toBe('15000');
    });
  });

  describe('Validación de Casos Límite y Resiliencia', () => {
    it('debe ignorar valores vacíos o malformados sin lanzar errores no controlados', () => {
      const input: CalculoInputDTO = {
        configuracion: {
          tipo: 'producto',
          nombre: 'Producto Test',
          moneda: 'ARS',
          periodo: 'mensual',
          unidadVenta: 'unidades',
          volumenEstimado: '10',
        },
        costosFijos: [{ id: '1', nombre: 'Fijo Válido', montoPeriodo: '5000' }],
        costosVariables: [
          { id: '1', nombre: 'Variable Válido', montoUnitario: '1000' },
          { id: '2', nombre: 'Variable Inválido', montoUnitario: '' },
        ],
        costosIndirectos: [],
        trabajoPropio: {
          incluir: false,
          horasPeriodo: '',
          valorHora: '',
        },
      };

      const result = service.calculateCosts(input);

      expect(result.totalCostosFijos).toBe('5000');
      expect(result.costoVariableUnitario).toBe('1000');
      expect(result.costoTotalPeriodo).toBe('15000'); // 5000 + (1000 * 10)
    });

    it('debe lanzar una excepción si el volumen estimado es cero o negativo', () => {
      const input: CalculoInputDTO = {
        configuracion: {
          tipo: 'producto',
          nombre: 'Producto Sin Volumen',
          moneda: 'ARS',
          periodo: 'mensual',
          unidadVenta: 'unidades',
          volumenEstimado: '0',
        },
        costosFijos: [],
        costosVariables: [],
        costosIndirectos: [],
        trabajoPropio: { incluir: false, horasPeriodo: '0', valorHora: '0' },
      };

      expect(() => service.calculateCosts(input)).toThrow(
        'El volumen estimado debe ser mayor a cero.'
      );
    });
  });
});