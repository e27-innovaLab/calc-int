const URL_RESPALDO = "https://calc-int.vercel.app";

/**
 * Dirección pública de la app, sin barra final.
 * Orden: NEXT_PUBLIC_SITE_URL (por ejemplo, un dominio propio) → dominio de producción que Vercel
 * informa para el proyecto que se está construyendo → dirección de respaldo.
 * Así el sitemap, el robots y los metadatos apuntan al proyecto desplegado aunque no se defina la variable.
 */
export function resolverUrlSitio(entorno: Record<string, string | undefined>): string {
  const definida = entorno.NEXT_PUBLIC_SITE_URL?.trim();
  const produccion = entorno.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const base = definida || (produccion ? `https://${produccion.replace(/^https?:\/\//, "")}` : URL_RESPALDO);
  return base.replace(/\/+$/, "");
}

export const URL_SITIO = resolverUrlSitio(process.env);

export const NOMBRE_SITIO = "Preciar";
export const DESCRIPCION_SITIO =
  "Calculá el costo real de lo que vendés, tu precio, tu punto de equilibrio y qué pasa si cambian tus costos. Gratis y sin registro.";
