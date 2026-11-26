// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { requestPasswordReset } from "@/lib/auth-client";

import { FormularioOlvide } from "./formulario-olvide";

vi.mock("@/lib/auth-client", () => ({ requestPasswordReset: vi.fn() }));

const pedirReseteo = vi.mocked(requestPasswordReset);

async function enviarCon(email: string) {
  render(<FormularioOlvide />);
  const campo = screen.getByLabelText("Email");
  if (email) await userEvent.type(campo, email);
  await userEvent.click(screen.getByRole("button", { name: "Enviarme el enlace" }));
}

describe("FormularioOlvide", () => {
  beforeEach(() => {
    pedirReseteo.mockReset();
  });

  it("avisa si el email está vacío y no llama al servidor", async () => {
    await enviarCon("");

    expect(screen.getByRole("alert")).toHaveTextContent("Escribí tu email.");
    expect(screen.getByLabelText("Email")).toHaveFocus();
    expect(pedirReseteo).not.toHaveBeenCalled();
  });

  it("avisa si el email no tiene formato válido y no llama al servidor", async () => {
    await enviarCon("sin-arroba");

    expect(screen.getByRole("alert")).toHaveTextContent("falta el @ o el dominio");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
    expect(pedirReseteo).not.toHaveBeenCalled();
  });

  it("pide el enlace con el email sin espacios y la ruta de restablecer", async () => {
    pedirReseteo.mockResolvedValue({ data: {}, error: null } as never);

    await enviarCon("  ana@correo.com ");

    expect(pedirReseteo).toHaveBeenCalledWith({ email: "ana@correo.com", redirectTo: "/restablecer" });
  });

  it("confirma el envío con el mismo mensaje, exista o no la cuenta", async () => {
    // Un 404 del servidor no se le muestra a la persona: no se revela qué emails están registrados.
    pedirReseteo.mockResolvedValue({ data: null, error: { status: 404, message: "no existe" } } as never);

    await enviarCon("nadie@correo.com");

    expect(screen.getByRole("heading", { name: "Revisá tu correo" })).toBeInTheDocument();
    expect(screen.getByText("nadie@correo.com")).toBeInTheDocument();
  });

  it("avisa cuando hubo demasiados intentos", async () => {
    pedirReseteo.mockResolvedValue({ data: null, error: { status: 429, message: "rate" } } as never);

    await enviarCon("ana@correo.com");

    expect(screen.getByRole("alert")).toHaveTextContent("demasiados intentos");
    expect(screen.queryByRole("heading", { name: "Revisá tu correo" })).not.toBeInTheDocument();
  });

  it("avisa cuando el servidor falla", async () => {
    pedirReseteo.mockResolvedValue({ data: null, error: { status: 500, message: "boom" } } as never);

    await enviarCon("ana@correo.com");

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos enviar el enlace");
  });

  it("avisa cuando falla la conexión", async () => {
    pedirReseteo.mockRejectedValue(new Error("sin red"));

    await enviarCon("ana@correo.com");

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos enviar el enlace");
  });

  it("permite volver al formulario para usar otro email", async () => {
    pedirReseteo.mockResolvedValue({ data: {}, error: null } as never);
    await enviarCon("ana@correo.com");

    await userEvent.click(screen.getByRole("button", { name: "Usar otro email" }));

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });
});
