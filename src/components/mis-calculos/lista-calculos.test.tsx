// @vitest-environment jsdom
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  borrarCalculoGuardado,
  cambiarCompartido,
  listarMisCalculos,
  type ResumenCalculo,
} from "@/lib/api-calculos";
import { signOut, useSession } from "@/lib/auth-client";

import { ListaCalculos } from "./lista-calculos";

const router = { push: vi.fn(), refresh: vi.fn() };

vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/lib/auth-client", () => ({ useSession: vi.fn(), signOut: vi.fn() }));
vi.mock("@/lib/api-calculos", async (importarOriginal) => ({
  ...(await importarOriginal<typeof import("@/lib/api-calculos")>()),
  listarMisCalculos: vi.fn(),
  cambiarCompartido: vi.fn(),
  borrarCalculoGuardado: vi.fn(),
}));

const sesion = vi.mocked(useSession);
const listar = vi.mocked(listarMisCalculos);
const alternar = vi.mocked(cambiarCompartido);
const borrar = vi.mocked(borrarCalculoGuardado);

// jsdom no implementa showModal/close del <dialog>.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
  };
});

function calculo(parcial: Partial<ResumenCalculo>): ResumenCalculo {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    nombre: "Torta",
    tipo: "producto",
    pasoActual: "costos",
    compartido: false,
    creadoEn: "2026-11-01T12:00:00.000Z",
    actualizadoEn: "2026-11-10T12:00:00.000Z",
    ...parcial,
  };
}

const MARIA = calculo({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", nombre: "María", actualizadoEn: "2026-11-05T12:00:00.000Z" });
const ALFAJOR = calculo({ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", nombre: "Alfajor", actualizadoEn: "2026-11-20T12:00:00.000Z", compartido: true });
const SIN_NOMBRE = calculo({ id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", nombre: "  ", actualizadoEn: "2026-11-25T12:00:00.000Z" });

function conSesion(email = "ana@correo.com") {
  sesion.mockReturnValue({ data: { user: { email } }, isPending: false } as never);
}

/** Títulos de las tarjetas, en el orden en que aparecen. */
function titulos() {
  return screen.getAllByRole("listitem").map((li) => within(li).getByRole("heading", { level: 2 }).textContent);
}

describe("ListaCalculos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    conSesion();
    listar.mockResolvedValue({ calculos: [MARIA, ALFAJOR, SIN_NOMBRE], limite: 5 });
  });

  it("mientras carga la cuenta muestra un aviso", () => {
    sesion.mockReturnValue({ data: null, isPending: true } as never);
    render(<ListaCalculos />);

    expect(screen.getByText("Cargando tu cuenta…")).toBeInTheDocument();
  });

  it("sin sesión invita a iniciar sesión y vuelve a Mis cálculos", () => {
    sesion.mockReturnValue({ data: null, isPending: false } as never);
    render(<ListaCalculos />);

    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute("href", "/cuenta?volver=/mis-calculos");
    expect(listar).not.toHaveBeenCalled();
  });

  it("con sesión muestra el email, el contador y los cálculos más recientes primero", async () => {
    render(<ListaCalculos />);

    expect(await screen.findByText("3 de 5 cálculos guardados")).toBeInTheDocument();
    expect(screen.getByText("ana@correo.com")).toBeInTheDocument();
    expect(titulos()).toEqual(["Cálculo sin nombre", "Alfajor", "María"]);
  });

  it("ordena por nombre sin distinguir tildes y deja los sin nombre al final", async () => {
    render(<ListaCalculos />);
    await screen.findByText("3 de 5 cálculos guardados");

    await userEvent.selectOptions(screen.getByLabelText("Ordenar por"), "az");
    expect(titulos()).toEqual(["Alfajor", "María", "Cálculo sin nombre"]);

    await userEvent.selectOptions(screen.getByLabelText("Ordenar por"), "za");
    expect(titulos()).toEqual(["María", "Alfajor", "Cálculo sin nombre"]);

    await userEvent.selectOptions(screen.getByLabelText("Ordenar por"), "antiguos");
    expect(titulos()).toEqual(["María", "Alfajor", "Cálculo sin nombre"]);
  });

  it("indica en qué paso quedó cada cálculo y si el link está activo", async () => {
    render(<ListaCalculos />);
    await screen.findByText("3 de 5 cálculos guardados");

    const tarjeta = screen.getAllByRole("listitem")[1];
    expect(tarjeta).toHaveTextContent("Quedó en: Costos");
    expect(tarjeta).toHaveTextContent("Link activo");
    expect(screen.getAllByRole("listitem")[2]).toHaveTextContent("Link desactivado");
  });

  it("«Copiar link» está deshabilitado si el cálculo no está compartido", async () => {
    render(<ListaCalculos />);
    await screen.findByText("3 de 5 cálculos guardados");

    const [, conLink, sinLink] = screen.getAllByRole("listitem");
    expect(within(conLink).getByRole("button", { name: "Copiar link" })).toBeEnabled();
    expect(within(sinLink).getByRole("button", { name: "Copiar link" })).toBeDisabled();
  });

  it("activa el link de un cálculo y avisa", async () => {
    alternar.mockResolvedValue(true);
    render(<ListaCalculos />);
    await screen.findByText("3 de 5 cálculos guardados");

    const [, , conLinkDesactivado] = screen.getAllByRole("listitem");
    await userEvent.click(within(conLinkDesactivado).getByRole("button", { name: "Activar link" }));

    expect(alternar).toHaveBeenCalledWith(MARIA.id, true);
    expect(await screen.findByText("Activaste el link para compartirlo.")).toBeInTheDocument();
  });

  it("avisa si no se pudo cambiar el link", async () => {
    alternar.mockResolvedValue(false);
    render(<ListaCalculos />);
    await screen.findByText("3 de 5 cálculos guardados");

    await userEvent.click(within(screen.getAllByRole("listitem")[1]).getByRole("button", { name: "Desactivar link" }));

    expect(await screen.findByText("No pudimos cambiar el link. Probá de nuevo.")).toBeInTheDocument();
  });

  it("pide confirmación antes de borrar y no borra si se cancela", async () => {
    render(<ListaCalculos />);
    await screen.findByText("3 de 5 cálculos guardados");

    await userEvent.click(within(screen.getAllByRole("listitem")[1]).getByRole("button", { name: "Borrar" }));
    const dialogo = await screen.findByRole("dialog", { name: "¿Borrar este cálculo?" });
    expect(dialogo).toHaveTextContent("«Alfajor»");

    await userEvent.click(within(dialogo).getByRole("button", { name: "Cancelar" }));

    expect(borrar).not.toHaveBeenCalled();
  });

  it("borra el cálculo confirmado y recarga la lista", async () => {
    borrar.mockResolvedValue(true);
    render(<ListaCalculos />);
    await screen.findByText("3 de 5 cálculos guardados");

    await userEvent.click(within(screen.getAllByRole("listitem")[1]).getByRole("button", { name: "Borrar" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Sí, borrar" }));

    expect(borrar).toHaveBeenCalledWith(ALFAJOR.id);
    expect(await screen.findByText("Borraste «Alfajor».")).toBeInTheDocument();
    expect(listar).toHaveBeenCalledTimes(2);
  });

  it("muestra el estado vacío con un camino para empezar", async () => {
    listar.mockResolvedValue({ calculos: [], limite: 5 });
    render(<ListaCalculos />);

    expect(await screen.findByText("Todavía no guardaste ningún cálculo")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Empezar mi cálculo" })).toHaveAttribute("href", "/calculadora/producto");
  });

  it("si falla la carga ofrece reintentar y se recupera", async () => {
    listar.mockResolvedValueOnce(null);
    render(<ListaCalculos />);

    expect(await screen.findByText("No pudimos cargar tus cálculos")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    await waitFor(() => expect(screen.getByText("3 de 5 cálculos guardados")).toBeInTheDocument());
    expect(screen.queryByText("No pudimos cargar tus cálculos")).not.toBeInTheDocument();
  });

  it("al cerrar sesión vuelve al inicio", async () => {
    vi.mocked(signOut).mockResolvedValue(undefined as never);
    render(<ListaCalculos />);
    await screen.findByText("3 de 5 cálculos guardados");

    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(signOut).toHaveBeenCalled();
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/"));
  });
});
