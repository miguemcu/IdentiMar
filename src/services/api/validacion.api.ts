import type { ObservacionDetalle } from '../../types';
import type { IValidacionService } from '../validacion.service';
import { noIntegrada } from './no-integrada';

/**
 * Esqueleto de la implementación real (H2). No hace llamadas de red todavía.
 * La cola de pendientes (GET /observaciones/pendientes) vive en ObservacionesApiService.
 */
export class ValidacionApiService implements IValidacionService {
  // POST /observaciones/{id}/validacion con JSON ValidacionInput (rol experto).
  // 200 -> ObservacionDetalle; 400 -> ErrorValidacion; 401 -> NoAutenticado;
  // 403 -> SinPermiso; 404 -> NoEncontrado; 409 -> Error (estado no admite validación).
  async validarObservacion(): Promise<ObservacionDetalle> {
    throw noIntegrada('POST /observaciones/{id}/validacion');
  }
}
