/**
 * Tipos de usuario y autenticación según contrato_integracion.yaml
 */

export type Rol = 'usuario' | 'experto' | 'administrador';

export interface UsuarioPublico {
  id: string;
  nombre_completo: string;
  correo: string;
  rol: Rol;
  activo?: boolean;
  creado_en?: string;
}

export interface RegistroRequest {
  nombre_completo: string;
  correo: string;
  password: string;
  telefono?: string | null;
}

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  usuario: UsuarioPublico;
}
