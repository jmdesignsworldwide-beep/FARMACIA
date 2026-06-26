/** Categorías del catálogo (compartidas entre cliente y servidor). */
export const CATEGORIAS = [
  "Analgésicos",
  "Antibióticos",
  "Antihipertensivos",
  "Diabetes",
  "Respiratorios",
  "Gastrointestinales",
  "Antialérgicos",
  "Vitaminas",
  "Neurológicos",
  "Dermatológicos",
  "Otros",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];
