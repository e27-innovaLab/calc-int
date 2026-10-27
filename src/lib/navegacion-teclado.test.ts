import { describe, expect, it } from "vitest";

import { indiceDePestana } from "./navegacion-teclado";

describe("indiceDePestana", () => {
  it("derecha y abajo avanzan, y la última vuelve a la primera", () => {
    expect(indiceDePestana("ArrowRight", 0, 2)).toBe(1);
    expect(indiceDePestana("ArrowDown", 0, 3)).toBe(1);
    expect(indiceDePestana("ArrowRight", 1, 2)).toBe(0);
  });

  it("izquierda y arriba retroceden, y la primera va a la última", () => {
    expect(indiceDePestana("ArrowLeft", 1, 2)).toBe(0);
    expect(indiceDePestana("ArrowUp", 2, 3)).toBe(1);
    expect(indiceDePestana("ArrowLeft", 0, 2)).toBe(1);
  });

  it("Inicio y Fin van a los extremos", () => {
    expect(indiceDePestana("Home", 1, 3)).toBe(0);
    expect(indiceDePestana("End", 0, 3)).toBe(2);
  });

  it("otras teclas no navegan (Tab, Enter y Espacio siguen con su comportamiento)", () => {
    for (const tecla of ["Tab", "Enter", " ", "a", "Escape"]) expect(indiceDePestana(tecla, 0, 2)).toBeNull();
  });

  it("sin pestañas no hay a dónde ir", () => {
    expect(indiceDePestana("ArrowRight", 0, 0)).toBeNull();
  });
});
