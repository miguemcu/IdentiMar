import type { IAuthService } from './auth.service';
import type { IObservacionesService } from './observaciones.service';
import type { IValidacionService } from './validacion.service';
import type { ICatalogosService } from './catalogos.service';

import { AuthMockService } from './mock/auth.mock';
import { ObservacionesMockService } from './mock/observaciones.mock';
import { ValidacionMockService } from './mock/validacion.mock';
import { CatalogosMockService } from './mock/catalogos.mock';
import { ObservacionesApiService } from './api/observaciones.api';

export * from './auth.service';
export * from './observaciones.service';
export * from './validacion.service';
export * from './catalogos.service';
export * from './errores';

const USE_API = process.env.EXPO_PUBLIC_USE_API === 'true';

let authServiceInstance: IAuthService;
let observacionesServiceInstance: IObservacionesService;
let validacionServiceInstance: IValidacionService;
let catalogosServiceInstance: ICatalogosService;

const mockObs = new ObservacionesMockService();

if (USE_API) {
  // Solo observaciones tiene esqueleto API (lanza error explícito); el resto sigue en mock.
  console.warn(
    '[IdentiMar Services] EXPO_PUBLIC_USE_API activo: observaciones usa el esqueleto API, que aún no está integrado.'
  );
  observacionesServiceInstance = new ObservacionesApiService();
} else {
  observacionesServiceInstance = mockObs;
}
authServiceInstance = new AuthMockService();
validacionServiceInstance = new ValidacionMockService(mockObs);
catalogosServiceInstance = new CatalogosMockService();

export const authService = authServiceInstance;
export const observacionesService = observacionesServiceInstance;
export const validacionService = validacionServiceInstance;
export const catalogosService = catalogosServiceInstance;
