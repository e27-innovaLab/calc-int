// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Aviso } from "./aviso";
import { Boton, BotonLink, clasesBoton } from "./boton";
import { Campo, clasesCampo } from "./campo";

describe("Boton", () => {
  it("es de tipo button por defecto, para no enviar formularios sin querer", () => {
    render(<Boton>Guardar</Boton>);

    expect(screen.getByRole("button", { name: "Guardar" })).toHaveAttribute("type", "button");
  });

  it("permite ser de tipo submit", () => {
    render(<Boton type="submit">Enviar</Boton>);

    expect(screen.getByRole("button", { name: "Enviar" })).toHaveAttribute("type", "submit");
  });

  it("llama a onClick y no lo hace si está deshabilitado", async () => {
    const alClick = vi.fn();
    const { rerender } = render(<Boton onClick={alClick}>Ir</Boton>);

    await userEvent.click(screen.getByRole("button", { name: "Ir" }));
    expect(alClick).toHaveBeenCalledTimes(1);

    rerender(
      <Boton onClick={alClick} disabled>
        Ir
      </Boton>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Ir" }));
    expect(alClick).toHaveBeenCalledTimes(1);
  });

  it("aplica la variante pedida", () => {
    expect(clasesBoton("peligro")).toContain("bg-danger-700");
    expect(clasesBoton("secundario")).toContain("border-gray-400");
    expect(clasesBoton()).toContain("bg-primary-900");
  });

  it("BotonLink se muestra como enlace con su destino", () => {
    render(<BotonLink href="/cuenta">Iniciar sesión</BotonLink>);

    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/cuenta");
  });
});

describe("Campo", () => {
  it("asocia la etiqueta con el control", () => {
    render(
      <Campo idControl="email" etiqueta="Email">
        <input id="email" />
      </Campo>,
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("muestra el error como alerta y con un símbolo, no solo con color", () => {
    render(
      <Campo idControl="email" etiqueta="Email" error="Escribí tu email." idError="email-error">
        <input id="email" />
      </Campo>,
    );

    const alerta = screen.getByRole("alert");
    expect(alerta).toHaveTextContent("Escribí tu email.");
    expect(alerta).toHaveAttribute("id", "email-error");
    expect(alerta).toHaveTextContent("✕");
  });

  it("no muestra alerta si no hay error", () => {
    render(
      <Campo idControl="email" etiqueta="Email" descripcion="El que usaste al registrarte">
        <input id="email" />
      </Campo>,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("El que usaste al registrarte")).toBeInTheDocument();
  });

  it("el estilo cambia cuando el campo es inválido", () => {
    expect(clasesCampo(true)).toContain("border-danger-600");
    expect(clasesCampo(false)).toContain("border-gray-400");
  });
});

describe("Aviso", () => {
  it("muestra título y contenido", () => {
    render(
      <Aviso tono="advertencia" titulo="Ojo">
        Revisá los costos.
      </Aviso>,
    );

    expect(screen.getByText("Ojo")).toBeInTheDocument();
    expect(screen.getByText("Revisá los costos.")).toBeInTheDocument();
  });

  it("el ícono es decorativo: no se depende solo del color ni se lee dos veces", () => {
    render(<Aviso tono="info">Dato</Aviso>);

    expect(screen.getByText("ℹ")).toHaveAttribute("aria-hidden", "true");
  });
});
