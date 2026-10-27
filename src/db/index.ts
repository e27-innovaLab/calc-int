/*Conecta a la base de datos de la pagina web Neon y utiliza el driver 
de drizzle para integrarse con Neon, Drizzle es un ORM de typescript para
interactuar con bases de datos SQL.*/

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
