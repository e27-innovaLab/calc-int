"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { signOut, useSession } from "@/lib/auth-client";

/**
 * Acceso a la cuenta en la parte superior derecha del recorrido.
 * Con sesión (Figma «Home-UsuarioRegistrado»): botón con la inicial y el nombre que despliega
 * «Mis cálculos», «Ajustes» y «Cerrar sesión». Sin sesión: invita a iniciar sesión.
 * «Iniciar sesión» lleva a /cuenta y, al terminar, vuelve a la pantalla donde estaba la persona.
 */
export function MenuUsuario({ compacto = false }: { compacto?: boolean }) {
  const { data: sesion, isPending } = useSession();
  const ruta = usePathname();
  if (isPending) return null;

  if (!sesion) {
    return (
      <Link
        href={`/cuenta?volver=${encodeURIComponent(ruta)}`}
        className="block max-w-full truncate text-sm font-semibold text-primary-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-primary-600"
      >
        Iniciar sesión
      </Link>
    );
  }

  return <Desplegable nombre={sesion.user.name || sesion.user.email} compacto={compacto} />;
}

const CLASES_OPCION =
  "flex min-h-12 w-full items-center px-4 text-left text-sm text-gray-900 hover:bg-gray-50 " +
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-700";

/** `compacto`: solo la inicial (la cabecera de la calculadora no tiene lugar para el nombre al lado de los 5 pasos). */
function Desplegable({ nombre, compacto }: { nombre: string; compacto: boolean }) {
  const router = useRouter();
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const inicial = nombre.trim().charAt(0).toUpperCase() || "?";

  // Se cierra al hacer clic afuera o con Escape (y el foco vuelve al botón).
  useEffect(() => {
    if (!abierto) return;
    function alClic(e: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(e.target as Node)) setAbierto(false);
    }
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    }
    document.addEventListener("mousedown", alClic);
    document.addEventListener("keydown", alTeclear);
    return () => {
      document.removeEventListener("mousedown", alClic);
      document.removeEventListener("keydown", alTeclear);
    };
  }, [abierto]);

  async function alCerrarSesion() {
    setAbierto(false);
    await signOut();
    router.push("/");
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        ref={boton}
        type="button"
        aria-expanded={abierto}
        aria-controls={`${id}-menu`}
        onClick={() => setAbierto((v) => !v)}
        className="flex min-h-11 max-w-48 items-center gap-2 rounded-lg border border-gray-300 bg-white py-1.5 pr-2.5 pl-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700"
      >
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-900 text-sm font-bold text-white">
          {inicial}
        </span>
        <span className={compacto ? "sr-only" : "truncate"}>{nombre}</span>
        <span aria-hidden="true" className="text-gray-700">
          ⌄
        </span>
        <span className="sr-only">, menú de la cuenta</span>
      </button>
      {abierto ? (
        <ul
          id={`${id}-menu`}
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
        >
          <li>
            <Link href="/mis-calculos" onClick={() => setAbierto(false)} className={CLASES_OPCION}>
              Mis cálculos
            </Link>
          </li>
          <li>
            <Link href="/ajustes" onClick={() => setAbierto(false)} className={CLASES_OPCION}>
              Ajustes
            </Link>
          </li>
          <li className="border-t border-gray-200">
            <button type="button" onClick={alCerrarSesion} className={`${CLASES_OPCION} text-danger-700`}>
              Cerrar sesión
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
