import type {
  ValidacionInput,
  ObservacionDetalle,
} from '../types';

export interface IValidacionService {
  validarObservacion(
    id: string,
    validacion: ValidacionInput
  ): Promise<ObservacionDetalle>;
}
