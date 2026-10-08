import type { ObservacionDetalle, ValidacionInput } from "../../types";
import type { IValidacionService } from "../validacion.service";
import { simularRetardo } from "./delay";
import type { ObservacionesMockService } from "./observaciones.mock";

export class ValidacionMockService implements IValidacionService {
  constructor(private observacionesService?: ObservacionesMockService) {}

  async validarObservacion(
    id: string,
    validacion: ValidacionInput,
  ): Promise<ObservacionDetalle> {
    await simularRetardo();

    if (!this.observacionesService) {
      throw new Error(
        "Servicio de observaciones no configurado para validación",
      );
    }

    return this.observacionesService.aplicarValidacion(id, validacion);
  }
}
