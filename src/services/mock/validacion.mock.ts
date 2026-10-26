import type { IValidacionService } from '../validacion.service';
import type { ValidacionInput, ObservacionDetalle } from '../../types';
import { ErrorServicio } from '../errores';
import { simularRetardo } from './delay';
import type { ObservacionesMockService } from './observaciones.mock';

export class ValidacionMockService implements IValidacionService {
  constructor(private observacionesService?: ObservacionesMockService) {}

  async validarObservacion(
    id: string,
    validacion: ValidacionInput
  ): Promise<ObservacionDetalle> {
    await simularRetardo();

    // EXPO_PUBLIC_MOCK_ERROR=403-validacion | 409-validacion: fuerza el error.
    const forzado = process.env.EXPO_PUBLIC_MOCK_ERROR;
    if (forzado === '403-validacion') {
      throw new ErrorServicio(403, {
        codigo: 'sin-permiso',
        mensaje: 'No tienes permiso para realizar esta acción.',
      });
    }
    if (forzado === '409-validacion') {
      throw new ErrorServicio(409, {
        codigo: 'estado-invalido',
        mensaje: 'La observación no está en un estado que admita validación.',
      });
    }

    if (!this.observacionesService) {
      throw new Error('Servicio de observaciones no configurado para validación');
    }

    return this.observacionesService.aplicarValidacion(id, validacion);
  }
}
