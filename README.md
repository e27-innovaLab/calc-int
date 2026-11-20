# calc-int — PRECIAR

Calculadora de costos, precios y punto de equilibrio para emprendimientos. Recorrido guiado en
5 pasos, con cuentas, guardado de cálculos y enlaces para compartir.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · zustand · Zod · decimal.js · Vitest.
Backend opcional: Drizzle + PostgreSQL (Neon) + Better Auth + envío de mails por SMTP.

## Requisitos

- Node.js 20.9+ (recomendado 22 LTS) y npm.

## Correr el proyecto

```bash
git clone <URL-DEL-REPO>
cd calc-int
npm install
npm run dev        # http://localhost:3000
```

El recorrido y el cálculo funcionan **sin base de datos** (se guarda en el navegador).

Otros comandos: `npm test` · `npm run lint` · `npm run build`

## Guardar, compartir y cuentas (opcional)

Solo si querés la persistencia y el login. Creá un `.env.local` en la raíz:

```bash
DATABASE_URL=postgresql://...            # Neon (cadena "pooled")
BETTER_AUTH_SECRET=...                    # 32+ chars: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
BETTER_AUTH_URL=http://localhost:3000     # en prod, la URL pública
# Envío de mails (verificación y reseteo). Sin esto, en desarrollo el enlace se imprime en la consola.
GMAIL_USER=tu-cuenta@gmail.com
GMAIL_APP_PASSWORD=clave-de-aplicacion-16-letras
MAIL_FROM_NOMBRE=PRECIAR
```

Después creá las tablas:

```bash
npm run db:push
```

> `npm run db:push` hay que correrlo la primera vez **y cada vez que cambia el esquema**, contra la
> base que uses (local o la del deploy). Si la app compila pero algo falla al guardar o al registrarse,
> casi siempre faltó este paso. Detalle del login y el mail en `docs/login-y-mail.md`.

## Notas (warnings y demás)

- **"N moderate vulnerabilities" al instalar:** vienen de herramientas de desarrollo (drizzle-kit) y
  **no afectan producción**. Se pueden ignorar. No corras `npm audit fix --force` (rompe las migraciones).
- **Avisos `deprecated` / `npm warn`:** son informativos, no errores. Si `npm run dev` levanta, está todo bien.
- **En desarrollo, "compiling" lento la primera vez:** es normal; Next compila cada página al visitarla.
  Si se queda clavado, parar el server, `rm -rf .next` y volver a `npm run dev`.

## Más documentación

En `docs/`: backend y endpoints (`backend.md`), base de datos (`esquema.sql`), seguridad, login/mail y backups.

