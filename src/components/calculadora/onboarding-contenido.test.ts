import { describe, expect, it } from "vitest";

import {
  PASOS_ONBOARDING,
  conPasoCerrado,
  leerCerrados,
  pasoOnboardingPorRuta,
  sinPasoCerrado,
} from "./onboarding-contenido";

describe("contenido del onboarding", () => {
  it("tiene una tarjeta por cada uno de los 5 pasos, en el orden del recorrido", () => {
    expect(PASOS_ONBOARDING.map((p) => p.ruta)).toEqual([
      "/calculadora/producto",
      "/calculadora/costos",
      "/calculadora/resumen",
      "/calculadora/precio",
      "/calculadora/simulador",
    ]);
  });

  it("cada tarjeta explica al menos una palabra, sin términos ni definiciones vacías", () => {
    for (const paso of PASOS_ONBOARDING) {
      expect(paso.terminos.length).toBeGreaterThan(0);
      for (const t of paso.terminos) {
        expect(t.termino.trim()).not.toBe("");
        expect(t.definicion.trim()).not.toBe("");
      }
    }
  });

  it("el paso 1 invita a pasar el cursor y el resto trae un dato útil", () => {
    expect(PASOS_ONBOARDING[0].invitacion).toBeDefined();
    for (const paso of PASOS_ONBOARDING.slice(1)) expect(paso.datoUtil).toBeDefined();
  });

  it("usa voseo (sin «tú» ni formas como «compras hecho»)", () => {
    const todo = PASOS_ONBOARDING.map((p) => [p.titulo, ...p.cuerpo.map((t) => t.texto), p.datoUtil ?? ""].join(" ")).join(" ");
    expect(todo).not.toMatch(/\b(compras|tienes|puedes|quieres)\b/i);
  });
});

describe("pasoOnboardingPorRuta", () => {
  it("devuelve el índice del paso y null fuera del recorrido", () => {
    expect(pasoOnboardingPorRuta("/calculadora/producto")).toBe(0);
    expect(pasoOnboardingPorRuta("/calculadora/simulador")).toBe(4);
    expect(pasoOnboardingPorRuta("/mis-calculos")).toBeNull();
    expect(pasoOnboardingPorRuta(null)).toBeNull();
  });
});

describe("pasos cerrados guardados", () => {
  it("lee una lista válida, sin repetidos y ordenada", () => {
    expect(leerCerrados("[3,1,3]")).toEqual([1, 3]);
  });

  it("ignora lo que no sirve: vacío, roto, de otro tipo o fuera de rango", () => {
    expect(leerCerrados(null)).toEqual([]);
    expect(leerCerrados("")).toEqual([]);
    expect(leerCerrados("{no es json")).toEqual([]);
    expect(leerCerrados('{"a":1}')).toEqual([]);
    expect(leerCerrados('[0,"1",-1,5,2.5,null,4]')).toEqual([0, 4]);
  });

  it("cerrar y reabrir un paso no repite ni toca los demás", () => {
    expect(conPasoCerrado([0, 2], 1)).toEqual([0, 1, 2]);
    expect(conPasoCerrado([0, 2], 2)).toEqual([0, 2]);
    expect(sinPasoCerrado([0, 1, 2], 1)).toEqual([0, 2]);
    expect(sinPasoCerrado([0], 3)).toEqual([0]);
  });
});
