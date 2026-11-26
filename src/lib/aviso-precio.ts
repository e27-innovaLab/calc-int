/**
 * Texto del aviso que aparece cuando el precio queda por debajo del costo por unidad.
 * Si cada venta no cubre ni los insumos (contribución ≤ 0) se dice que se pierde plata en cada venta;
 * si los insumos sí se cubren, se aclara que lo que falta es llegar al costo completo.
 */
export function mensajePrecioBajoCosto(costoUnitario: string, pierdePorUnidad: boolean): string {
  if (pierdePorUnidad) {
    return `Tu costo por unidad es de ${costoUnitario}. Con este precio perdés plata en cada venta.`;
  }
  return `Tu costo por unidad es de ${costoUnitario}, con tu trabajo y tus gastos fijos incluidos. Con este precio cada venta cubre tus insumos, pero a este volumen no llegás a ganar.`;
}
