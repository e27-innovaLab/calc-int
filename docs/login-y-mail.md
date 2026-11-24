# Login: verificación de email, reseteo y requisitos de contraseña

Qué quedó activado en el backend de autenticación (Better Auth) y cómo enviar los emails **gratis con
Gmail** (sin dominio ni costo).

## Qué hace ahora el login

- **Requisitos de contraseña:** mínimo 8 caracteres, al menos una letra y un número.
- **Verificación de email:** al registrarse se manda un mail con enlace de confirmación; hasta
  confirmarlo no se puede iniciar sesión (en producción siempre; en desarrollo solo si configuraste Gmail).
- **Reseteo de contraseña:** páginas `/olvide` y `/restablecer`. El enlace vence en 1 hora.
- **Registro abierto:** la verificación obliga a controlar el buzón, que es la defensa estándar.

## Enviar emails con Gmail (gratis, sin dominio)

Sin configurar nada, en **desarrollo** el enlace se imprime en la **consola del servidor** (la terminal
de `npm run dev`), así probás el flujo sin ningún proveedor. Para mails reales:

### 1. Instalar la librería

```bash
npm install nodemailer
npm install -D @types/nodemailer
```

### 2. Crear la "contraseña de aplicación" (2FA ya activado)

1. Entrá a la cuenta de Gmail del proyecto → <https://myaccount.google.com/apppasswords>
   (o Seguridad → Contraseñas de aplicaciones).
2. Poné un nombre (ej. "PreciJusto") y **Crear**.
3. Copiá la clave de **16 letras** que te muestra (va sin espacios).

### 3. Cargar las variables (en `.env.local` y en Vercel)

```
GMAIL_USER=tu-cuenta-del-proyecto@gmail.com
GMAIL_APP_PASSWORD=la-clave-de-16-letras
MAIL_FROM_NOMBRE=PreciJusto
```

¡Listo! Gmail permite cientos de envíos por día, de sobra para este proyecto.

> **Notas:**
> - Usá la **contraseña de aplicación**, no la contraseña normal de Gmail.
> - Puede que los primeros mails caigan en "spam" (normal para una cuenta nueva).
> - Para la entrega, la contraseña de aplicación se pasa junto con la cuenta del proyecto.

## Variables nuevas

| Variable | Obligatoria | Para qué |
|---|---|---|
| `GMAIL_USER` | para mandar mails reales | la dirección de Gmail del proyecto |
| `GMAIL_APP_PASSWORD` | para mandar mails reales | la contraseña de aplicación de 16 caracteres |
| `MAIL_FROM_NOMBRE` | no | nombre visible del remitente (por defecto "PreciJusto") |

## Cómo probar

**Sin Gmail (solo consola):** `npm run dev` → en `/test_de_guardado` creá una cuenta → el enlace de
confirmación aparece en la terminal (`[mail:simulado] ...`) → abrilo. Para reseteo, `/olvide`.

**Con Gmail configurado:** igual, pero el enlace llega al email.
