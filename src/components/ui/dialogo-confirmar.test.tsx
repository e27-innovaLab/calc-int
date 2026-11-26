// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { DialogoConfirmar } from "./dialogo-confirmar";

// jsdom no implementa showModal/close del <dialog>: se simulan marcando el atributo `open`.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

function montar(props: Partial<Parameters<typeof DialogoConfirmar>[0]> = {}) {
  const onConfirmar = vi.fn();
  const onCancelar = vi.fn();
  render(
    <DialogoConfirmar
      abierto
      titulo="¿Borrar este cálculo?"
      descripcion="No se puede deshacer."
      etiquetaConfirmar="Sí, borrar"
      onConfirmar={onConfirmar}
      onCancelar={onCancelar}
      {...props}
    />,
  );
  return { onConfirmar, onCancelar };
}

describe("DialogoConfirmar", () => {
  it("se abre cuando `abierto` es verdadero y está nombrado y descripto para lectores de pantalla", () => {
    montar();

    const dialogo = screen.getByRole("dialog", { name: "¿Borrar este cálculo?" });
    expect(dialogo).toHaveAttribute("open");
    expect(dialogo).toHaveAccessibleDescription("No se puede deshacer.");
  });

  it("queda cerrado cuando `abierto` es falso", () => {
    montar({ abierto: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.querySelector("dialog")).not.toHaveAttribute("open");
  });

  it("confirma con el botón de confirmación", async () => {
    const { onConfirmar, onCancelar } = montar();

    await userEvent.click(screen.getByRole("button", { name: "Sí, borrar" }));

    expect(onConfirmar).toHaveBeenCalledTimes(1);
    expect(onCancelar).not.toHaveBeenCalled();
  });

  it("cancela con el botón Cancelar", async () => {
    const { onConfirmar, onCancelar } = montar();

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
    expect(onConfirmar).not.toHaveBeenCalled();
  });

  it("cancela con Esc (evento cancel del dialog)", () => {
    const { onCancelar } = montar();

    fireEvent(document.querySelector("dialog")!, new Event("cancel", { cancelable: true }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  it("cancela al hacer clic en el fondo, no al hacer clic dentro", async () => {
    const { onCancelar } = montar();

    await userEvent.click(screen.getByText("No se puede deshacer."));
    expect(onCancelar).not.toHaveBeenCalled();

    fireEvent.click(document.querySelector("dialog")!);
    expect(onCancelar).toHaveBeenCalledTimes(1);
  });

  it("permite cambiar las etiquetas y muestra contenido extra", () => {
    montar({ etiquetaCancelar: "Mejor no", children: <a href="/ayuda">Ver ayuda</a> });

    expect(screen.getByRole("button", { name: "Mejor no" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver ayuda" })).toBeInTheDocument();
  });
});
