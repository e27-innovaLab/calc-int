# calc-int-backend

Backend y motor financiero de la Calculadora Inteligente de costos, precios y punto de equilibrio para emprendimientos.

## Stack

- **Node.js** (v20+ / v24) + **Express**
- **TypeScript**
- **tsx** para ejecución y recarga en desarrollo
- **zod** para validación de esquemas e ingreso de datos
- **decimal.js** para precisión financiera estricta
(operaciones con `DecimalString`)
- **Vitest** para pruebas unitarias automatizadas del motor financiero
- **cors** para integración segura con el cliente web

## Cómo correrlo

```bash
npm install
npm run dev        # Servidor Express en http:/localhost:3000
npm test           # Pruebas unitarias del motor con Vitest
npm run build      # Compilación a JavaScript (tsc)
npm start          # Ejecución en entorno de producción


## Estructura 

src/
  controllers/
    calculator.controller.ts    Controladores HTTP y manejo de respuestas REST
  schemas/
    calculator.schema.ts        Validación de entrada de datos con Zod
  services/
    calculator.ts               Motor financiero central (lógica de negocio con decimal.js)
    calculator.test.ts          Pruebas unitarias de las fórmulas y reglas del negocio
  types/
    calculator.ts               Tipos del dominio y DTOs serializados (DecimalString)
  server.ts                     Punto de entrada de la aplicación Express