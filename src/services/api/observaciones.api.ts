import type {
  ObservacionDetalle,
  ObservacionesPagina,
  ObservacionResumen,
} from '../../types';
import type { IObservacionesService } from '../observaciones.service';

function noIntegrada(endpoint: string): Error {
  return new Error(
    `[IdentiMar] ${endpoint} aún no está integrado. Usa EXPO_PUBLIC_USE_API=false.`
  );
}

/**
 * Esqueleto de la implementación real (H2). No hace llamadas de red todavía.
 */
export class ObservacionesApiService implements IObservacionesService {
  // POST /observaciones con multipart/form-data:
  //   datos  -> JSON.stringify(ObservacionInput)
  //   imagen -> { uri, type: mimeType, name: nombre }
  // 201 -> ObservacionResumen; 400/401/413 -> ErrorServicio con el cuerpo Error.
  async crearObservacion(): Promise<ObservacionResumen> {
    throw noIntegrada('POST /observaciones');
  }

  async listarObservaciones(): Promise<ObservacionesPagina> {
    throw noIntegrada('GET /observaciones');
  }

  async obtenerObservacion(): Promise<ObservacionDetalle> {
    throw noIntegrada('GET /observaciones/{id}');
  }

  async listarPendientes(): Promise<ObservacionesPagina> {
    throw noIntegrada('GET /observaciones/pendientes');
  }
}
