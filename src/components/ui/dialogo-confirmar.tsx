"use client";

import { useEffect, useId, useRef } from "react";

import { Boton } from "./boton";

interface PropsDialogoConfirmar {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  etiquetaConfirmar: string;
  etiquetaCancelar?: string;
  /** «peligro» (rojo) para acciones que borran datos; «primario» para confirmar algo que no se pierde. */
  varianteConfirmar?: "peligro" | "primario";
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Confirmación modal. Usa <dialog> nativo: atrapa el foco, se cierra con Esc y devuelve el foco al elemento que
 * lo abrió. El foco inicial queda en «Cancelar». Los `id` son propios de cada diálogo: una pantalla puede tener varios.
 */
export function DialogoConfirmar({
  abierto,
  titulo,
  descripcion,
  etiquetaConfirmar,
  etiquetaCancelar = "Cancelar",
  varianteConfirmar = "peligro",
  onConfirmar,
  onCancelar,
}: PropsDialogoConfirmar) {
  const ref = useRef<HTMLDialogElement>(null);
  const idBase = useId();
  const idTitulo = `${idBase}-titulo`;
  const idDescripcion = `${idBase}-descripcion`;

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      aria-describedby={idDescripcion}
      onCancel={(e) => {
        e.preventDefault();
        onCancelar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onCancelar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-gray-900 shadow-xl backdrop:bg-gray-900/40"
    >
      <h2 id={idTitulo} className="text-lg font-bold">
        {titulo}
      </h2>
      <p id={idDescripcion} className="mt-2 text-sm text-gray-700">
        {descripcion}
      </p>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Boton variante="secundario" autoFocus onClick={onCancelar}>
          {etiquetaCancelar}
        </Boton>
        <Boton variante={varianteConfirmar} onClick={onConfirmar}>
          {etiquetaConfirmar}
        </Boton>
      </div>
    </dialog>
  );
}
