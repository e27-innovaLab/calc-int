import { describe, expect, it } from "vitest";

import { crearAlmacenSeguro } from "./almacen-seguro";

function almacenEnMemoria(inicial: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicial));
  return {
    datos,
    almacen: {
      getItem: (k: string) => datos.get(k) ?? null,
      setItem: (k: string, v: string) => void datos.set(k, v),
      removeItem: (k: string) => void datos.delete(k),
    } as unknown as Storage,
  };
}

describe("crearAlmacenSeguro", () => {
  it("devuelve el valor guardado cuando es JSON válido", () => {
    const { almacen } = almacenEnMemoria({ k: '{"a":1}' });
    expect(crearAlmacenSeguro(() => almacen).getItem("k")).toBe('{"a":1}');
  });

  it("devuelve null si la clave no existe", () => {
    const { almacen } = almacenEnMemoria();
    expect(crearAlmacenSeguro(() => almacen).getItem("k")).toBeNull();
  });

  it("descarta un borrador corrupto y devuelve null", () => {
    const { almacen, datos } = almacenEnMemoria({ k: "{{{no-json" });
    expect(crearAlmacenSeguro(() => almacen).getItem("k")).toBeNull();
    expect(datos.has("k")).toBe(false);
  });

  it("no lanza si el navegador bloquea el almacenamiento", () => {
    const bloqueado = () => {
      throw new DOMException("bloqueado", "SecurityError");
    };
    const seguro = crearAlmacenSeguro(bloqueado);
    expect(seguro.getItem("k")).toBeNull();
    expect(() => seguro.setItem("k", "{}")).not.toThrow();
    expect(() => seguro.removeItem("k")).not.toThrow();
  });

  it("no lanza si setItem falla por falta de espacio", () => {
    const { almacen } = almacenEnMemoria();
    almacen.setItem = () => {
      throw new DOMException("lleno", "QuotaExceededError");
    };
    expect(() => crearAlmacenSeguro(() => almacen).setItem("k", "{}")).not.toThrow();
  });
});
