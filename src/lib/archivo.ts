/**
 * Nombre del archivo de imagen del resumen: «preciar-resumen-velas-de-soja.png».
 * Sin tildes ni símbolos (los sistemas de archivos y los correos los tratan distinto) y de largo acotado.
 * Un nombre vacío o sin letras ni números queda como «producto».
 */
export function nombreArchivoResumen(nombreProducto: string): string {
  const base = nombreProducto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return `preciar-resumen-${base || "producto"}.png`;
}
