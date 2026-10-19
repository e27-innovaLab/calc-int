import { Request, Response } from "express";
import { CalculateRequestSchema } from "../schemas/calculator.schema.js";
import { CalculatorService } from "../services/calculator.js";

export const calculateHandler = (req: Request, res: Response) => {
  const result = CalculateRequestSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Datos de entrada inválidos",
      details: result.error.format(),
    });
  }

  const calculation = CalculatorService.calcular(result.data);
  return res.status(200).json(calculation);
};