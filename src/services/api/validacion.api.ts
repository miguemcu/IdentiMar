import type { ObservacionDetalle, ValidacionInput } from '../../types';
import type { IValidacionService } from '../validacion.service';
import { aDetalle } from './adaptadores';
import { pedir } from './http';

/**
 * La cola de pendientes (GET /observaciones/pendientes) vive en
 * ObservacionesApiService.
 */
export class ValidacionApiService implements IValidacionService {
  // POST /observaciones/{id}/validacion con JSON ValidacionInput (rol experto).
  // 200 -> ObservacionDetalle; 400 -> ErrorValidacion; 401 -> NoAutenticado;
  // 403 -> SinPermiso; 404 -> NoEncontrado; 409 -> Error (estado no admite validación).
  async validarObservacion(
    id: string,
    validacion: ValidacionInput,
  ): Promise<ObservacionDetalle> {
    // El contrato permite especie_final_codigo y comentario nulos (rechazo o
    // sin comentario), pero el backend rechaza null: se omiten, que vale para los dos.
    const { especie_final_codigo, comentario, ...resto } = validacion;
    const cuerpo = {
      ...resto,
      ...(especie_final_codigo ? { especie_final_codigo } : {}),
      ...(comentario ? { comentario } : {}),
    };
    const ruta = `/observaciones/${encodeURIComponent(id)}`;
    await pedir(`${ruta}/validacion`, { metodo: 'POST', cuerpo });
    // El contrato responde con ObservacionDetalle, pero el backend no trae el
    // detalle completo (ni validación ni historial): se vuelve a pedir.
    return aDetalle(await pedir(ruta));
  }
}
