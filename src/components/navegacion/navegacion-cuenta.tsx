import Link from "next/link";

const CLASES =
  "rounded px-1 py-2 text-sm text-gray-900 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary-700";

/**
 * Enlaces del centro de la cabecera en las pantallas de la cuenta (Figma: «Inicio · Mis cálculos»).
 * Se usa en «Elegí cómo guardarlo» y en «Ajustes».
 */
export function NavegacionCuenta() {
  return (
    <nav aria-label="Navegación" className="hidden items-center justify-center gap-6 sm:flex">
      <Link href="/" className={CLASES}>
        Inicio
      </Link>
      <Link href="/mis-calculos" className={CLASES}>
        Mis cálculos
      </Link>
    </nav>
  );
}
