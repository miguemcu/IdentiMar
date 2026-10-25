import type { IAuthService } from './auth.service';
import type { IObservacionesService } from './observaciones.service';
import type { IValidacionService } from './validacion.service';
import type { ICatalogosService } from './catalogos.service';

import { AuthMockService } from './mock/auth.mock';
import { ObservacionesMockService } from './mock/observaciones.mock';
import { ValidacionMockService } from './mock/validacion.mock';
import { CatalogosMockService } from './mock/catalogos.mock';
import { AuthApiService } from './api/auth.api';
import { ObservacionesApiService } from './api/observaciones.api';
import { ValidacionApiService } from './api/validacion.api';
import { CatalogosApiService } from './api/catalogos.api';

export * from './auth.service';
export * from './observaciones.service';
export * from './validacion.service';
export * from './catalogos.service';
export * from './errores';

const USE_API = process.env.EXPO_PUBLIC_USE_API === 'true';

/** true mientras la app usa datos simulados (sin backend). */
export const MODO_SIMULADO = !USE_API;

let authServiceInstance: IAuthService;
let observacionesServiceInstance: IObservacionesService;
let validacionServiceInstance: IValidacionService;
let catalogosServiceInstance: ICatalogosService;

if (USE_API) {
  // Todos los dominios usan su esqueleto API (lanza error explícito).
  console.warn(
    '[IdentiMar Services] EXPO_PUBLIC_USE_API activo: los servicios usan los esqueletos API, que aún no están integrados.'
  );
  authServiceInstance = new AuthApiService();
  observacionesServiceInstance = new ObservacionesApiService();
  validacionServiceInstance = new ValidacionApiService();
  catalogosServiceInstance = new CatalogosApiService();
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
