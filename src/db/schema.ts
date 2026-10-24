/*Importa las funciones a usar*/ 
import { pgTable, uuid, jsonb, timestamp } from "drizzle-orm/pg-core";


/*
Define el schema de la tabla a usar:
1° columna: UUID para el link
2° columna: json con los datos del formulario
3° columna: fecha de creacion
*/
export const calculos = pgTable("calculo", {
  id: uuid("id").defaultRandom().primaryKey(),
  datosFormulario: jsonb("datos_formulario").notNull(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
});
