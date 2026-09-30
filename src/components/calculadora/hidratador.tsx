"use client";

import { useEffect } from "react";

import { useCalculoStore } from "@/store/calculo-store";

/** Dispara la lectura del borrador guardado (localStorage) una sola vez, ya en el navegador. */
export function Hidratador() {
  useEffect(() => {
    void useCalculoStore.persist.rehydrate();
  }, []);
  return null;
}
