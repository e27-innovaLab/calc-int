// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePathname } from "next/navigation";

import { Pasos } from "./pasos";

vi.mock("next/navigation", () => ({ usePathname: vi.fn() }));

const rutaActual = vi.mocked(usePathname);

describe("Pasos", () => {
  it("marca el paso actual y lo anuncia como paso en curso", () => {
    rutaActual.mockReturnValue("/calculadora/costos");
    render(<Pasos />);

    expect(screen.getByRole("link", { name: /Costos/ })).toHaveAttribute("aria-current", "step");
    expect(screen.getByText(/^Paso 2 de 5/)).toBeInTheDocument();
  });

  it("los pasos ya recorridos son enlaces y se anuncian como completados", () => {
    rutaActual.mockReturnValue("/calculadora/precio");
    render(<Pasos />);

    const producto = screen.getByRole("link", { name: /Tu producto/ });
    expect(producto).toHaveAttribute("href", "/calculadora/producto");
    expect(producto).toHaveTextContent("(completado)");
    expect(screen.getByRole("link", { name: /Resumen/ })).toHaveTextContent("(completado)");
  });

  it("los pasos que faltan no son enlaces y se anuncian como próximamente", () => {
    rutaActual.mockReturnValue("/calculadora/producto");
    render(<Pasos />);

    expect(screen.queryByRole("link", { name: /Costos/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Simulador/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("(próximamente)")).toHaveLength(4);
  });

  it("en el primer paso no hay ninguno completado", () => {
    rutaActual.mockReturnValue("/calculadora/producto");
    render(<Pasos />);

    expect(screen.queryByText("(completado)")).not.toBeInTheDocument();
    expect(screen.getByText(/^Paso 1 de 5/)).toBeInTheDocument();
  });

  it("en el último paso quedan los cuatro anteriores como completados", () => {
    rutaActual.mockReturnValue("/calculadora/simulador");
    render(<Pasos />);

    expect(screen.getAllByText("(completado)")).toHaveLength(4);
    expect(screen.getByText(/^Paso 5 de 5/)).toBeInTheDocument();
  });

  it("fuera de los pasos no muestra el progreso móvil ni marca ninguno como actual", () => {
    rutaActual.mockReturnValue("/otra-ruta");
    render(<Pasos />);

    expect(screen.queryByText(/Paso \d de 5/)).not.toBeInTheDocument();
    expect(document.querySelector("[aria-current]")).toBeNull();
  });

  it("tiene una navegación con nombre accesible", () => {
    rutaActual.mockReturnValue("/calculadora/costos");
    render(<Pasos />);

    expect(screen.getByRole("navigation", { name: "Pasos del cálculo" })).toBeInTheDocument();
  });
});
