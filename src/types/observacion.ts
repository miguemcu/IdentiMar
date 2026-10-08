/**
 * Tipos de observaciones e inferencia según contrato_integracion.yaml
 */

import type {
  CatalogoItem,
  CondicionOrganismo,
  TipoAmbiente,
} from "./catalogo";
import type { Especie } from "./especie";
import type { UsuarioPublico } from "./usuario";
import type { ValidacionExperta } from "./validacion";

export type EstadoObservacion =
  | "recibido"
  | "procesando"
  | "identificado"
  | "no_concluyente"
  | "pendiente_experto"
  | "validado"
  | "corregido";

export interface Prediccion {
  id: string;
  especie_propuesta: Especie;
  confianza: number;
  version_modelo: string;
  creado_en: string;
}

export interface TransicionEstado {
  estado_anterior?: EstadoObservacion | null;
  estado_nuevo: EstadoObservacion;
  actor?: string | null;
  motivo?: string | null;
  creado_en: string;
}

export interface ObservacionInput {
  fecha_hora_evento: string;
  latitud: number;
  longitud: number;
  precision_gps_metros?: number | null;
  tipo_ambiente: TipoAmbiente;
  condicion_organismo: CondicionOrganismo;
  observaciones_usuario?: string | null;
}

export interface ObservacionResumen {
  id: string;
  estado: EstadoObservacion;
  creado_en: string;
  fecha_hora_evento?: string;
  imagen_url?: string;
  especie_aceptada?: Especie | null;
  confianza?: number | null;
}

export interface ObservacionDetalle extends ObservacionResumen {
  usuario?: UsuarioPublico;
  latitud?: number;
  longitud?: number;
  precision_gps_metros?: number | null;
  tipo_ambiente?: CatalogoItem;
  condicion_organismo?: CatalogoItem;
  observaciones_usuario?: string | null;
  prediccion_original?: Prediccion | null;
  validacion_experta?: ValidacionExperta | null;
  historial_estados?: TransicionEstado[];
}

export interface ObservacionesPagina {
  items: ObservacionResumen[];
  pagina: number;
  tamano: number;
  total: number;
}
