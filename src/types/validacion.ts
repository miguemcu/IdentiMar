/**
 * Tipos de validación experta según contrato_integracion.yaml
 */

import type { Especie } from "./especie";
import type { UsuarioPublico } from "./usuario";

export type DecisionValidacion = "confirmada" | "corregida" | "rechazada";

export interface ValidacionInput {
  decision: DecisionValidacion;
  especie_final_codigo?: string | null;
  comentario?: string | null;
}

export interface ValidacionExperta {
  id: string;
  decision: DecisionValidacion;
  especie_final?: Especie | null;
  comentario?: string | null;
  experto: UsuarioPublico;
  creado_en: string;
}
