import { afterEach } from "vitest";

// Solo en las pruebas de componentes (entorno jsdom): matchers de DOM y limpieza entre pruebas.
if (typeof document !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");
  afterEach(cleanup);
}
