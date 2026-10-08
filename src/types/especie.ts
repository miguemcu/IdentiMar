/**
 * Tipos de especies y taxonomía según contrato_integracion.yaml
 * TODO: Este archivo se eliminará en futuras versiones, debido al alcance del proyecto.
 */

export type GrupoEspecie = "raya" | "tiburon";

export interface Familia {
  id: string;
  nombre_cientifico: string;
  descripcion?: string | null;
}

export interface Especie {
  id: string;
  codigo: string;
  nombre_cientifico: string;
  nombre_comun?: string | null;
  familia?: Familia;
  grupo?: GrupoEspecie;
  descripcion?: string | null;
  url_imagen_referencia?: string | null;
}
