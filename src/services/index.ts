import type { IAuthService } from "./auth.service";
import type { ICatalogosService } from "./catalogos.service";
import type { IObservacionesService } from "./observaciones.service";
import type { IValidacionService } from "./validacion.service";

import { AuthMockService } from "./mock/auth.mock";
import { CatalogosMockService } from "./mock/catalogos.mock";
import { ObservacionesMockService } from "./mock/observaciones.mock";
import { ValidacionMockService } from "./mock/validacion.mock";

export * from "./auth.service";
export * from "./catalogos.service";
export * from "./observaciones.service";
export * from "./validacion.service";

const USE_API = process.env.EXPO_PUBLIC_USE_API === "true";

let authServiceInstance: IAuthService;
let observacionesServiceInstance: IObservacionesService;
let validacionServiceInstance: IValidacionService;
let catalogosServiceInstance: ICatalogosService;

if (USE_API) {
  // Nota: la implementación API real se conectará cuando el backend esté integrado.
  // Por ahora se mantiene advertencia y fallback al mock sin escribir llamadas de red.
  console.warn(
    "[IdentiMar Services] EXPO_PUBLIC_USE_API activo, pero la implementación API real aún no existe. Utilizando capa mock.",
  );
  const mockObs = new ObservacionesMockService();
  authServiceInstance = new AuthMockService();
  observacionesServiceInstance = mockObs;
  validacionServiceInstance = new ValidacionMockService(mockObs);
  catalogosServiceInstance = new CatalogosMockService();
} else {
  const mockObs = new ObservacionesMockService();
  authServiceInstance = new AuthMockService();
  observacionesServiceInstance = mockObs;
  validacionServiceInstance = new ValidacionMockService(mockObs);
  catalogosServiceInstance = new CatalogosMockService();
}

export const authService = authServiceInstance;
export const observacionesService = observacionesServiceInstance;
export const validacionService = validacionServiceInstance;
export const catalogosService = catalogosServiceInstance;
