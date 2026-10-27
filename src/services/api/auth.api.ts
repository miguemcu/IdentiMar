import type {
  LoginRequest,
  LoginResponse,
  RegistroRequest,
  UsuarioPublico,
} from '../../types';
import type { IAuthService } from '../auth.service';
import { pedir } from './http';
import { usuarioDeSesion } from './sesion';

/**
 * El contrato responde `UsuarioPublico`; el backend lo envía dentro de
 * `usuario` en el registro y el perfil. Se aceptan las dos formas.
 */
function usuarioDe(respuesta: UsuarioPublico | { usuario: UsuarioPublico }): UsuarioPublico {
  return 'usuario' in respuesta ? respuesta.usuario : respuesta;
}

export class AuthApiService implements IAuthService {
  // POST /auth/registro (sin token). 201 -> UsuarioPublico; 400; 409.
  async registro(datos: RegistroRequest): Promise<UsuarioPublico> {
    // El contrato permite telefono nulo, pero el backend lo rechaza: si no
    // hay teléfono se omite el campo, que vale para los dos.
    const { telefono, ...resto } = datos;
    const cuerpo = telefono ? { ...resto, telefono } : resto;
    return usuarioDe(
      await pedir('/auth/registro', { metodo: 'POST', cuerpo, conToken: false }),
    );
  }

  // POST /auth/login (sin token). 200 -> LoginResponse; 400; 401.
  async login(datos: LoginRequest): Promise<LoginResponse> {
    return pedir<LoginResponse>('/auth/login', {
      metodo: 'POST',
      cuerpo: datos,
      conToken: false,
    });
  }

  // POST /auth/refresh (sin token). El cliente HTTP ya renueva solo ante un
  // 401; esto queda para cumplir la interfaz. El backend devuelve solo
  // access_token y expires_in: el resto se completa con la sesión actual.
  async refresh(refreshToken: string): Promise<LoginResponse> {
    const resp = await pedir<Partial<LoginResponse> & Pick<LoginResponse, 'access_token' | 'expires_in'>>(
      '/auth/refresh',
      { metodo: 'POST', cuerpo: { refresh_token: refreshToken }, conToken: false },
    );
    const usuario = resp.usuario ?? usuarioDeSesion();
    if (!usuario) throw new Error('No hay una sesión que renovar.');
    return {
      access_token: resp.access_token,
      expires_in: resp.expires_in,
      refresh_token: resp.refresh_token ?? refreshToken,
      usuario,
    };
  }

  // GET /auth/perfil con token. 200 -> UsuarioPublico; 401.
  async obtenerPerfil(): Promise<UsuarioPublico> {
    return usuarioDe(await pedir('/auth/perfil'));
  }
}
