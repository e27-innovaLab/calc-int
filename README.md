# calc-int

Calculadora inteligente de costos, precios y punto de equilibrio para emprendimientos.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** para estilos
- **react-hook-form** + **zod** para formularios y validación
- **decimal.js** para cálculos monetarios (nunca operar importes con `number`)
- **zustand** para el estado del recorrido
- **Vitest** para pruebas unitarias

## Cómo correrlo

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # pruebas unitarias
npm run lint
npm run build
```

Requiere Node 20.9 o superior.

## Estructura

```
src/
  app/              Páginas y layout (Next.js App Router)
  domain/
    types.ts        Tipos del dominio: configuración, costos, trabajo propio, resultados
    motor/          Motor de cálculo: funciones puras, sin React, con sus *.test.ts
```

Regla principal: **las fórmulas viven en `src/domain/motor/`, separadas de la interfaz**, y cada función tiene su prueba unitaria. Los componentes solo muestran resultados.

## Convenciones

- Los importes se guardan como `string` (`"1250.50"`) y se operan con Decimal.js. El formato visual ($ 1.250,50) se aplica solo al mostrar.
- Cambios por rama + Pull Request a `main`.
