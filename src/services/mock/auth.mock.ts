import type {
  LoginRequest,
  LoginResponse,
  RegistroRequest,
  UsuarioPublico,
} from "../../types";
import type { IAuthService } from "../auth.service";
import { simularRetardo } from "./delay";
import { MOCK_USUARIOS } from "./mockData";

export class AuthMockService implements IAuthService {
  private usuarioActual: UsuarioPublico = MOCK_USUARIOS.usuario;

  async registro(datos: RegistroRequest): Promise<UsuarioPublico> {
    await simularRetardo();
    const nuevoUsuario: UsuarioPublico = {
      id: `u1a-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nombre_completo: datos.nombre_completo,
      correo: datos.correo,
      rol: "usuario",
      activo: true,
      creado_en: new Date().toISOString(),
    };
    this.usuarioActual = nuevoUsuario;
    return nuevoUsuario;
  }

  async login(datos: LoginRequest): Promise<LoginResponse> {
    await simularRetardo();

    // Si coincide con correo de experto o admin, asignamos ese rol
    if (datos.correo.includes("experto") || datos.correo.includes("invemar")) {
      this.usuarioActual = MOCK_USUARIOS.experto;
    } else if (datos.correo.includes("admin")) {
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
