/**
 * Tipos de errores y respuestas de error según contrato_integracion.yaml
 */

export interface DetalleError {
  campo?: string;
  problema?: string;
}

export interface ErrorApi {
  codigo: string;
  mensaje: string;
  detalles?: DetalleError[] | null;
}
