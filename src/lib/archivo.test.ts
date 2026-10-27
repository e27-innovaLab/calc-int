import { describe, expect, it } from "vitest";

import { nombreArchivoResumen } from "./archivo";

describe("nombreArchivoResumen", () => {
  it("pasa a minúsculas, sin tildes y con guiones", () => {
    expect(nombreArchivoResumen("Velas de Soja")).toBe("preciar-resumen-velas-de-soja.png");
    expect(nombreArchivoResumen("Torta de limón y coco")).toBe("preciar-resumen-torta-de-limon-y-coco.png");
    expect(nombreArchivoResumen("Ñandú ÁÉÍÓÚ")).toBe("preciar-resumen-nandu-aeiou.png");
  });

  it("quita símbolos y barras que no sirven en un nombre de archivo", () => {
    expect(nombreArchivoResumen("  Remera / estampada: 100% algodón!  ")).toBe("preciar-resumen-remera-estampada-100-algodon.png");
    expect(nombreArchivoResumen("../../etc/passwd")).toBe("preciar-resumen-etc-passwd.png");
  });

  it("un nombre vacío o sin letras ni números queda como «producto»", () => {
    expect(nombreArchivoResumen("")).toBe("preciar-resumen-producto.png");
    expect(nombreArchivoResumen("   ")).toBe("preciar-resumen-producto.png");
    expect(nombreArchivoResumen("¡¿?!")).toBe("preciar-resumen-producto.png");
  });

  it("acota el largo sin dejar un guion al final", () => {
    const largo = nombreArchivoResumen("a".repeat(100));
    expect(largo).toBe(`preciar-resumen-${"a".repeat(40)}.png`);
    const conCorte = nombreArchivoResumen(`${"a".repeat(39)} bbb`);
    expect(conCorte).toBe(`preciar-resumen-${"a".repeat(39)}.png`);
  });
});
