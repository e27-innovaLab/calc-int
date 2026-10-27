/**
 * Navegación con flechas de un grupo de pestañas (patrón WAI-ARIA «tabs»): derecha/abajo avanzan, izquierda/arriba
 * retroceden (dando la vuelta en los extremos), Inicio va a la primera y Fin a la última.
 * Devuelve el índice al que hay que ir, o null si la tecla no es de navegación (para no frenar Tab ni Enter).
 */
export function indiceDePestana(tecla: string, actual: number, total: number): number | null {
  if (total <= 0) return null;
  switch (tecla) {
    case "ArrowRight":
    case "ArrowDown":
      return (actual + 1) % total;
    case "ArrowLeft":
    case "ArrowUp":
      return (actual - 1 + total) % total;
    case "Home":
      return 0;
    case "End":
      return total - 1;
    default:
      return null;
  }
}
