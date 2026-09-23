import Decimal from "decimal.js";
import { describe, expect, it } from "vitest";

import { aMensual } from "./periodo";

describe("aMensual", () => {
  it("semanal se multiplica por 4", () => {
    expect(aMensual(new Decimal("2500"), "semanal").toString()).toBe("10000");
  });

  it("mensual queda igual", () => {
    expect(aMensual(new Decimal("80000.50"), "mensual").toString()).toBe("80000.5");
  });

  it("anual se divide por 12", () => {
    expect(aMensual(new Decimal("120000"), "anual").toString()).toBe("10000");
  });

  it("anual no redondea: la precisión se conserva hasta mostrar", () => {
    const mensual = aMensual(new Decimal("100"), "anual");
    expect(mensual.toDecimalPlaces(2).toString()).toBe("8.33");
    expect(mensual.times(12).toDecimalPlaces(10).toString()).toBe("100");
  });
});
