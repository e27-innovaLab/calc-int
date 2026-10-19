"use client";

import { useEffect, useRef } from "react";

import { Boton } from "./boton";

interface PropsDialogoConfirmar {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  etiquetaConfirmar: string;
  etiquetaCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Confirmación modal para acciones que borran datos. Usa <dialog> nativo: atrapa el foco,
 * se cierra con Esc y devuelve el foco al elemento que lo abrió. El foco inicial queda en «Cancelar».
 */
export function DialogoConfirmar({
  abierto,
  titulo,
  descripcion,
  etiquetaConfirmar,
  etiquetaCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}: PropsDialogoConfirmar) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialogo-titulo"
      aria-describedby="dialogo-descripcion"
      onCancel={(e) => {
        e.preventDefault();
        onCancelar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancelar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-xl backdrop:bg-gray-900/40"
    >
      <h2 id="dialogo-titulo" className="text-lg font-bold">
        {titulo}
      </h2>
      <p id="dialogo-descripcion" className="mt-2 text-sm text-gray-700">
        {descripcion}
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Boton variante="secundario" autoFocus onClick={onCancelar}>
          {etiquetaCancelar}
        </Boton>
        <Boton variante="peligro" onClick={onConfirmar}>
          {etiquetaConfirmar}
        </Boton>
      </div>
    </dialog>
  );
}
