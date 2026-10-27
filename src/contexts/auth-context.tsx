import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService } from '../services';
import { borrarBorrador } from '../services/local/borrador';
import type {
  UsuarioPublico,
  Rol,
  LoginRequest,
  LoginResponse,
  RegistroRequest,
} from '../types';

/** Tokens de la sesión según LoginResponse. Viven solo en memoria (secure-store llega en H2). */
interface TokensSesion {
  access_token: string;
  refresh_token: string;
  /** Segundos de vigencia del access token, tal como los entrega el servidor. */
  expires_in: number;
}

/** Por qué se cerró la sesión sin que el usuario lo pidiera. */
export type MotivoCierre = 'sesion-vencida';

const AVISO_CIERRE: Record<MotivoCierre, string> = {
  'sesion-vencida': 'Tu sesión venció, vuelve a entrar.',
};

interface AuthContextType {
  usuario: UsuarioPublico | null;
  rol: Rol | null;
  token: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  isLoading: boolean;
  /** Aviso para la pantalla de inicio de sesión tras un cierre automático. */
  avisoSesion: string | null;
  login: (datos: LoginRequest) => Promise<void>;
  registro: (datos: RegistroRequest) => Promise<void>;
  logout: (motivo?: MotivoCierre) => Promise<void>;
  cambiarRolMock: (rol: Rol) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [tokens, setTokens] = useState<TokensSesion | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [avisoSesion, setAvisoSesion] = useState<string | null>(null);

  useEffect(() => {
    // Inicialización de sesión simulada
    async function inicializarSesion() {
      try {
        setIsLoading(false);
      } catch {
        setIsLoading(false);
      }
    }
    inicializarSesion();
  }, []);

  const guardarSesion = useCallback((resp: LoginResponse) => {
    setUsuario(resp.usuario);
    setTokens({
      access_token: resp.access_token,
      refresh_token: resp.refresh_token,
      expires_in: resp.expires_in,
    });
  }, []);

  const login = useCallback(async (datos: LoginRequest) => {
    setIsLoading(true);
    setAvisoSesion(null);
    try {
      guardarSesion(await authService.login(datos));
    } finally {
      setIsLoading(false);
    }
  }, [guardarSesion]);

  const registro = useCallback(async (datos: RegistroRequest) => {
    setIsLoading(true);
    try {
      // El contrato responde 201 con UsuarioPublico, sin tokens: la sesión
      // se obtiene iniciando sesión con los mismos datos.
      await authService.registro(datos);
      guardarSesion(
        await authService.login({ correo: datos.correo, password: datos.password }),
      );
    } finally {
      setIsLoading(false);
    }
  }, [guardarSesion]);

  const logout = useCallback(async (motivo?: MotivoCierre) => {
    setIsLoading(true);
    try {
      // Al cerrar sesión a mano se descarta el borrador de esa cuenta. Si la
      // sesión venció (motivo), se conserva para no perder datos de campo.
      if (!motivo && usuario) borrarBorrador(usuario.id);
      setAvisoSesion(motivo ? AVISO_CIERRE[motivo] : null);
      setUsuario(null);
      setTokens(null);
    } finally {
      setIsLoading(false);
    }
  }, [usuario]);

  // No pasa por isLoading: así el cambio de rol vuelve a dibujar la app una
  // sola vez (con el nuevo usuario) en lugar de dos.
  const cambiarRolMock = useCallback(async (nuevoRol: Rol) => {
    const correo =
      nuevoRol === 'experto'
        ? 'carlos.mendoza@invemar.org.co'
        : nuevoRol === 'administrador'
          ? 'admin@identimar.udea.edu.co'
          : 'ana.torres@ejemplo.co';
    guardarSesion(await authService.login({ correo, password: 'password123' }));
  }, [guardarSesion]);

  // Valor estable: los componentes que usan useAuth solo se actualizan
  // cuando cambia algo de la sesión.
  const valor = useMemo<AuthContextType>(
    () => ({
      usuario,
      rol: usuario?.rol ?? null,
      token: tokens?.access_token ?? null,
      refreshToken: tokens?.refresh_token ?? null,
      expiresIn: tokens?.expires_in ?? null,
      isLoading,
      avisoSesion,
      login,
      registro,
      logout,
      cambiarRolMock,
    }),
    [usuario, tokens, isLoading, avisoSesion, login, registro, logout, cambiarRolMock],
  );

  return (
    <AuthContext.Provider value={valor}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un SessionProvider');
  }
  return context;
}
