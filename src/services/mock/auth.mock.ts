import type { IAuthService } from '../auth.service';
import type {
  RegistroRequest,
  LoginRequest,
  LoginResponse,
  UsuarioPublico,
} from '../../types';
import { ErrorServicio } from '../errores';
import { simularRetardo } from './delay';
import { MOCK_USUARIOS } from './mockData';

/** Correo que el mock trata como ya registrado (409). */
const CORREO_YA_REGISTRADO = 'ya.registrado@ejemplo.co';

/**
 * Permite probar los errores del registro sin backend:
 * EXPO_PUBLIC_MOCK_ERROR = 409 | 400-auth, o el correo ya.registrado@ejemplo.co.
 */
function errorRegistroSimulado(correo: string): ErrorServicio | null {
  const forzado = process.env.EXPO_PUBLIC_MOCK_ERROR;
  if (forzado === '409' || correo.trim().toLowerCase() === CORREO_YA_REGISTRADO) {
    return new ErrorServicio(409, {
      codigo: 'correo-registrado',
      mensaje: 'El correo ya está registrado.',
    });
  }
  if (forzado === '400-auth') {
    return new ErrorServicio(400, {
      codigo: 'validacion-fallida',
      mensaje: 'Uno o más campos no cumplen las restricciones.',
      detalles: [{ campo: 'correo', problema: 'Revisa el correo. Debe verse así: nombre@correo.com' }],
    });
  }
  return null;
}

export class AuthMockService implements IAuthService {
  private usuarioActual: UsuarioPublico = MOCK_USUARIOS.usuario;

  async registro(datos: RegistroRequest): Promise<UsuarioPublico> {
    await simularRetardo();
    const error = errorRegistroSimulado(datos.correo);
    if (error) throw error;
    const nuevoUsuario: UsuarioPublico = {
      id: `u1a-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nombre_completo: datos.nombre_completo,
      correo: datos.correo,
      rol: 'usuario',
      activo: true,
      creado_en: new Date().toISOString(),
    };
    this.usuarioActual = nuevoUsuario;
    return nuevoUsuario;
  }

  async login(datos: LoginRequest): Promise<LoginResponse> {
    await simularRetardo();

    // Si coincide con correo de experto o admin, asignamos ese rol
    if (datos.correo.includes('experto') || datos.correo.includes('invemar')) {
      this.usuarioActual = MOCK_USUARIOS.experto;
    } else if (datos.correo.includes('admin')) {
      this.usuarioActual = MOCK_USUARIOS.administrador;
    } else {
      this.usuarioActual = {
        ...MOCK_USUARIOS.usuario,
        correo: datos.correo,
      };
    }

    return {
      access_token: `mock-jwt-access-${Date.now()}`,
      refresh_token: `mock-jwt-refresh-${Date.now()}`,
      expires_in: 3600,
      usuario: this.usuarioActual,
    };
  }

  async refresh(_refreshToken: string): Promise<LoginResponse> {
    await simularRetardo();
    return {
      access_token: `mock-jwt-access-refreshed-${Date.now()}`,
      refresh_token: `mock-jwt-refresh-refreshed-${Date.now()}`,
      expires_in: 3600,
      usuario: this.usuarioActual,
    };
  }

  async obtenerPerfil(): Promise<UsuarioPublico> {
    await simularRetardo();
    return this.usuarioActual;
  }
}
