/*Este archivo le dice a Drizzle-kit, el ORM de typescript para interactuar con la base de datos neon, donde buscar lo que necesita */

//Importa la funcion usada para la configuracion de drizzle
import { defineConfig } from "drizzle-kit";

//Carga las variables de entorno del archivo .env.local
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts", //Donde esta ubicada el schema de la db
  out: "./drizzle", //Carpeta donde se guarda el historial de migraciones
  dialect: "postgresql", //Indica que se usa postgreSQL
  dbCredentials: {
    url: process.env.DATABASE_URL!, //Conecta a la URL de la base de datos
  },
});
