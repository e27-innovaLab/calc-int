import { describe, expect, it } from "vitest";
import { resolverUrlSitio } from "./sitio";

describe("resolverUrlSitio", () => {
  it("usa NEXT_PUBLIC_SITE_URL si está definida y le saca la barra final", () => {
    expect(resolverUrlSitio({ NEXT_PUBLIC_SITE_URL: "https://preciar.com.ar/", VERCEL_PROJECT_PRODUCTION_URL: "otro.vercel.app" })).toBe(
      "https://preciar.com.ar",
    );
  });

  it("sin variable propia usa el dominio de producción que informa Vercel", () => {
    expect(resolverUrlSitio({ VERCEL_PROJECT_PRODUCTION_URL: "calc-int-grupo27.vercel.app" })).toBe("https://calc-int-grupo27.vercel.app");
  });

  it("acepta que el dominio de Vercel ya traiga https://", () => {
    expect(resolverUrlSitio({ VERCEL_PROJECT_PRODUCTION_URL: "https://calc-int-56oi.vercel.app/" })).toBe("https://calc-int-56oi.vercel.app");
  });

  it("ignora valores vacíos y cae en la dirección de respaldo", () => {
    expect(resolverUrlSitio({ NEXT_PUBLIC_SITE_URL: "  ", VERCEL_PROJECT_PRODUCTION_URL: "" })).toBe("https://calc-int.vercel.app");
    expect(resolverUrlSitio({})).toBe("https://calc-int.vercel.app");
  });
});
