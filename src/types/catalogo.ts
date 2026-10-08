/**
 * Tipos de catálogos y vocabularios controlados según contrato_integracion.yaml
 */

export interface CatalogoItem {
  id: string;
  codigo: string;
  nombre_visible: string;
  descripcion?: string | null;
}

export type TipoAmbiente = string;
export type CondicionOrganismo = string;

export interface CatalogoEstadoItem extends CatalogoItem {
  es_terminal?: boolean;
  orden?: number;
}
