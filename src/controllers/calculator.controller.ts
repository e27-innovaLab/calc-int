// Creamos el controlador HTTP para recibir las peticiones del frontend y devolver la respuesta estructurada.

import { Request, Response } from "express";
import { FinancialCalculatorService } from "../services/calculator.js";
import { calculoInputSchema } from "../schemas/calculator.schema.js";
import { ZodError } from "zod";

const calculatorService = new FinancialCalculatorService();

export const calculateProductCosts = (req: Request, res: Response) => {
  try {
    const parsedData = calculoInputSchema.parse(req.body);
    const result = calculatorService.calculateCosts(parsedData);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.issues.map((issue) => ({
          campo: issue.path.join("."),
          mensaje: issue.message,
        })),
      });
    }

    return res.status(500).json({
      success: false,
      mensaje: error.message || "Error interno del servidor",
    });
  }
};