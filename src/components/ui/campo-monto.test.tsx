// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { CampoMonto } from "./campo-monto";

/** Envoltorio controlado: el estado guarda el valor normalizado, como hacen los formularios reales. */
function Controlado({ inicial = "", alCambiar }: { inicial?: string; alCambiar?: (v: string) => void }) {
  const [valor, setValor] = useState(inicial);
  return (
    <CampoMonto
      id="monto"
      ariaLabel="Importe"
      value={valor}
      onChange={(v) => {
        setValor(v);
        alCambiar?.(v);
      }}
    />
  );
}

describe("CampoMonto", () => {
  it("normaliza lo que se escribe: coma decimal y punto de miles", async () => {
    const alCambiar = vi.fn();
    render(<Controlado alCambiar={alCambiar} />);

    await userEvent.type(screen.getByLabelText("Importe"), "1.250,50");

    expect(alCambiar).toHaveBeenLastCalledWith("1250.50");
  });

  it("conserva el texto tal cual lo escribe la persona", async () => {
    render(<Controlado />);
    const campo = screen.getByLabelText("Importe");

    await userEvent.type(campo, "1.250,50");

    expect(campo).toHaveValue("1.250,50");
  });

  it("muestra con coma un valor que llega normalizado desde afuera", () => {
    render(<Controlado inicial="12.5" />);

    expect(screen.getByLabelText("Importe")).toHaveValue("12,5");
  });

  it("muestra el prefijo $ por defecto y el sufijo si se pide", () => {
    render(<CampoMonto id="horas" ariaLabel="Horas" value="" onChange={() => {}} sufijo="hs" />);

    expect(screen.getByText("$")).toBeInTheDocument();
    expect(screen.getByText("hs")).toBeInTheDocument();
  });

  it("no muestra prefijo si se pasa null", () => {
    render(<CampoMonto id="cantidad" ariaLabel="Cantidad" value="" onChange={() => {}} prefijo={null} />);

    expect(screen.queryByText("$")).not.toBeInTheDocument();
  });

  it("marca el campo como inválido y lo vincula con su mensaje de error", () => {
    render(<CampoMonto id="monto" ariaLabel="Importe" value="" onChange={() => {}} invalido idError="monto-error" />);

    const campo = screen.getByLabelText("Importe");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAttribute("aria-describedby", "monto-error");
  });

  it("limita la cantidad de caracteres que se pueden escribir", () => {
    render(<CampoMonto id="monto" ariaLabel="Importe" value="" onChange={() => {}} />);

    expect(screen.getByLabelText("Importe")).toHaveAttribute("maxlength", "30");
  });
});
