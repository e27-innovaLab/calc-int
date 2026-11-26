import { describe, expect, it } from "vitest";
import { mensajePrecioBajoCosto } from "./aviso-precio";

describe("mensajePrecioBajoCosto", () => {
  it("dice que se pierde plata en cada venta cuando no se cubren ni los insumos", () => {
    const texto = mensajePrecioBajoCosto("$800", true);
    expect(texto).toContain("$800");
    expect(texto).toContain("perdés plata en cada venta");
  });

  it("no dice que se pierde plata en cada venta si los insumos sí se cubren", () => {
    const texto = mensajePrecioBajoCosto("$300", false);
    expect(texto).toContain("$300");
    expect(texto).not.toContain("perdés plata");
    expect(texto).toContain("cubre tus insumos");
  });

  it("usa voseo", () => {
    expect(mensajePrecioBajoCosto("$1", false)).not.toMatch(/\b(tienes|puedes|quieres|llegas)\b/i);
    expect(mensajePrecioBajoCosto("$1", true)).not.toMatch(/\b(tienes|puedes|quieres)\b/i);
  });
});
