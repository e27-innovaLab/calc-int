"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

import { Boton, BotonLink } from "@/components/ui/boton";
import { Tarjeta } from "@/components/ui/tarjeta";
import { authClient, signOut, useSession } from "@/lib/auth-client";

const LARGO_MAXIMO_NOMBRE = 60;

const CLASES_CAMPO =
  "min-h-11 w-full rounded-xl border border-gray-400 bg-white px-4 py-2.5 text-base text-gray-900 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600";

/**
 * Formulario de «Ajustes» (Figma). El nombre se cambia con `updateUser` de Better Auth, que ya viene incluido
 * (POST /api/auth/update-user): no hace falta tocar el backend. El email se muestra pero no se edita,
 * porque Better Auth no permite cambiarlo por esa vía.
 */
export function FormularioAjustes() {
  const { data: sesion, isPending } = useSession();

  if (isPending) return <p className="text-sm text-gray-700">Cargando tu cuenta…</p>;

  if (!sesion) {
    return (
      <Tarjeta className="mx-auto flex max-w-md flex-col items-start gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="text-gray-700">Iniciá sesión para ver y cambiar los datos de tu cuenta.</p>
        <BotonLink href="/cuenta?volver=/ajustes">Iniciar sesión</BotonLink>
      </Tarjeta>
    );
  }

  // `key`: si cambia la sesión (por ejemplo, otro usuario), el formulario arranca de nuevo con sus datos.
  return <Formulario key={sesion.user.id} nombreInicial={sesion.user.name ?? ""} email={sesion.user.email} />;
}

function Formulario({ nombreInicial, email }: { nombreInicial: string; email: string }) {
  const router = useRouter();
  const id = useId();
  const [nombre, setNombre] = useState(nombreInicial);
  const [guardado, setGuardado] = useState(nombreInicial);
  const [guardando, setGuardando] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; error: boolean } | null>(null);

  const limpio = nombre.trim();
  const hayCambios = limpio !== guardado.trim();

  async function alGuardar(e: FormEvent) {
    e.preventDefault();
    if (!limpio) {
      setMensaje({ texto: "Escribí tu nombre.", error: true });
      return;
    }
    setGuardando(true);
    setMensaje(null);
    const { error } = await authClient.updateUser({ name: limpio });
    setGuardando(false);
    if (error) {
      setMensaje({ texto: "No pudimos guardar el cambio. Probá de nuevo.", error: true });
      return;
    }
    setGuardado(limpio);
    setNombre(limpio);
    setMensaje({ texto: "Listo, guardamos tu nombre.", error: false });
  }

  async function alCerrarSesion() {
    setSaliendo(true);
    await signOut();
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-900">Sesión: {email}</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">Ajustes</h1>
      </div>

      <Tarjeta>
        <form onSubmit={alGuardar} noValidate className="flex flex-col gap-6">
          <div>
            <label htmlFor={`${id}-nombre`} className="text-sm font-medium text-gray-900">
              Nombre
            </label>
            <input
              id={`${id}-nombre`}
              type="text"
              autoComplete="name"
              maxLength={LARGO_MAXIMO_NOMBRE}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              aria-describedby={`${id}-nombre-ayuda`}
              className={`mt-2 ${CLASES_CAMPO}`}
            />
            <p id={`${id}-nombre-ayuda`} className="mt-2 text-xs text-gray-700">
              Es el que ves arriba, en tu cuenta.
            </p>
          </div>

          <div>
            <label htmlFor={`${id}-email`} className="text-sm font-medium text-gray-900">
              Email
            </label>
            <input
              id={`${id}-email`}
              type="email"
              value={email}
              readOnly
              aria-describedby={`${id}-email-ayuda`}
              className={`mt-2 ${CLASES_CAMPO} bg-gray-50 text-gray-700`}
            />
            <p id={`${id}-email-ayuda`} className="mt-2 text-xs text-gray-700">
              Con este email iniciás sesión.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Boton type="submit" disabled={!hayCambios || guardando} aria-busy={guardando}>
              {guardando ? "Guardando…" : "Guardar cambios"}
            </Boton>
            <Boton variante="secundario" onClick={alCerrarSesion} disabled={saliendo} className="text-gray-900">
              {saliendo ? "Cerrando sesión…" : "Cerrar sesión"}
            </Boton>
          </div>

          <div role="status">
            {mensaje ? (
              <p
                className={`rounded-xl border px-4 py-3 text-sm ${
                  mensaje.error ? "border-danger-100 bg-danger-50 text-danger-700" : "border-success-100 bg-success-100 text-primary-900"
                }`}
              >
                {mensaje.texto}
              </p>
            ) : null}
          </div>
        </form>
      </Tarjeta>
    </div>
  );
}
