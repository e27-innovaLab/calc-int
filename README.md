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

- Los importes se guardan como `string` (`"1250.50"`) y se operan con Decimal.js. El redondeo a 2 decimales y el formato ($ 1.250,50) son solo visuales, al mostrar.
- Moneda: solo **ARS** en el MVP.
- Período: el motor es **estrictamente mensual**. Si la interfaz permite cargar importes semanales o anuales, se normalizan con `aMensual()` (semanal × 4, anual ÷ 12) antes de calcular.
- Clasificación de costos para no contabilizar dos veces:
  - **Variables** (base unidad): solo insumos directamente atribuibles a cada unidad.
  - **Fijos** e **indirectos** (base mensual): los indirectos se tratan como fijos del mes, sin prorrateo por unidad.
- Cambios por rama + Pull Request a `main`.
