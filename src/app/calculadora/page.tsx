import { redirect } from "next/navigation";

/** La entrada al recorrido es el primer paso. */
export default function CalculadoraPage() {
  redirect("/calculadora/producto");
}
