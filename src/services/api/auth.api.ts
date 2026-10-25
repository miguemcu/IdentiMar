import type { LoginResponse, UsuarioPublico } from '../../types';
import type { IAuthService } from '../auth.service';
import { noIntegrada } from './no-integrada';

/**
 * Esqueleto de la implementación real (H2). No hace llamadas de red todavía.
 */
export class AuthApiService implements IAuthService {
  // POST /auth/registro (sin token) con JSON RegistroRequest.
  // 201 -> UsuarioPublico (no devuelve tokens); 400 -> ErrorValidacion;
  // 409 -> Error (el correo ya está registrado).
  async registro(): Promise<UsuarioPublico> {
    throw noIntegrada('POST /auth/registro');
  }

  // POST /auth/login (sin token) con JSON LoginRequest.
  // 200 -> LoginResponse; 401 -> CredencialesInvalidas.
  async login(): Promise<LoginResponse> {
    throw noIntegrada('POST /auth/login');
  }

  // POST /auth/refresh (sin token) con JSON { refresh_token }.
  // 200 -> LoginResponse (nuevo par de tokens); 401 -> NoAutenticado.
  async refresh(): Promise<LoginResponse> {
    throw noIntegrada('POST /auth/refresh');
  }

  // GET /auth/perfil con Authorization: Bearer <access_token>.
  // 200 -> UsuarioPublico; 401 -> NoAutenticado.
  async obtenerPerfil(): Promise<UsuarioPublico> {
    throw noIntegrada('GET /auth/perfil');
  }
}
