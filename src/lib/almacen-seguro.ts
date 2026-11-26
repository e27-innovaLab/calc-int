import type { StateStorage } from "zustand/middleware";

/**
 * Acceso a localStorage que nunca lanza. Si el borrador guardado está corrupto (JSON inválido) o el
 * navegador bloquea el almacenamiento (modo privado, cookies bloqueadas), el recorrido arranca de cero
 * en vez de quedarse en el esqueleto de carga para siempre.
 */
export function crearAlmacenSeguro(obtenerAlmacen: () => Storage): StateStorage {
  return {
    getItem: (clave) => {
      try {
        const almacen = obtenerAlmacen();
        const valor = almacen.getItem(clave);
        if (valor === null) return null;
        JSON.parse(valor);
        return valor;
      } catch {
        try {
          obtenerAlmacen().removeItem(clave);
        } catch {
          // el almacenamiento no está disponible: no hay nada que limpiar
        }
        return null;
      }
    },
    setItem: (clave, valor) => {
      try {
        obtenerAlmacen().setItem(clave, valor);
      } catch {
        // sin espacio o bloqueado: el borrador sigue en memoria durante la sesión
      }
    },
    removeItem: (clave) => {
      try {
        obtenerAlmacen().removeItem(clave);
      } catch {
        // idem
      }
    },
  };
}
