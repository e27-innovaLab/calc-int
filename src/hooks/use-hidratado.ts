"use client";

import { useSyncExternalStore } from "react";

import { useCalculoStore } from "@/store/calculo-store";

/**
 * `true` cuando el borrador ya se leyó de localStorage. Hasta entonces las pantallas muestran un
 * esqueleto, para no dibujar un formulario vacío que un instante después se llena.
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(
    (alCambiar) => useCalculoStore.persist.onFinishHydration(alCambiar),
    () => useCalculoStore.persist.hasHydrated(),
    () => false,
  );
}
