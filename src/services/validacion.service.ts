import type { ObservacionDetalle, ValidacionInput } from "../types";

export interface IValidacionService {
  validarObservacion(
    id: string,
    validacion: ValidacionInput,
  ): Promise<ObservacionDetalle>;
}
