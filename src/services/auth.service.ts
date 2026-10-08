import type {
  LoginRequest,
  LoginResponse,
  RegistroRequest,
  UsuarioPublico,
} from "../types";

export interface IAuthService {
  registro(datos: RegistroRequest): Promise<UsuarioPublico>;
  login(datos: LoginRequest): Promise<LoginResponse>;
  refresh(refreshToken: string): Promise<LoginResponse>;
  obtenerPerfil(): Promise<UsuarioPublico>;
}
