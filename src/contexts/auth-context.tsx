import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService } from '../services';
import type {
  UsuarioPublico,
  Rol,
  LoginRequest,
  RegistroRequest,
} from '../types';

interface AuthContextType {
  usuario: UsuarioPublico | null;
  rol: Rol | null;
  token: string | null;
  isLoading: boolean;
  login: (datos: LoginRequest) => Promise<void>;
  registro: (datos: RegistroRequest) => Promise<void>;
  logout: () => Promise<void>;
  cambiarRolMock: (rol: Rol) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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

  const login = useCallback(async (datos: LoginRequest) => {
    setIsLoading(true);
    try {
      const resp = await authService.login(datos);
      setUsuario(resp.usuario);
      setToken(resp.access_token);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registro = useCallback(async (datos: RegistroRequest) => {
    setIsLoading(true);
    try {
      const nuevo = await authService.registro(datos);
      setUsuario(nuevo);
      setToken(`mock-token-${Date.now()}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      setUsuario(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // No pasa por isLoading: así el cambio de rol vuelve a dibujar la app una
  // sola vez (con el nuevo usuario) en lugar de dos.
  const cambiarRolMock = useCallback(async (nuevoRol: Rol) => {
    const correo =
      nuevoRol === 'experto'
        ? 'carlos.mendoza@invemar.org.co'
        : nuevoRol === 'administrador'
          ? 'admin@identimar.udea.edu.co'
          : 'ana.torres@ejemplo.co';
    const resp = await authService.login({ correo, password: 'password123' });
    setUsuario(resp.usuario);
    setToken(resp.access_token);
  }, []);

  // Valor estable: los componentes que usan useAuth solo se actualizan
  // cuando cambia algo de la sesión.
  const valor = useMemo<AuthContextType>(
    () => ({
      usuario,
      rol: usuario?.rol ?? null,
      token,
      isLoading,
      login,
      registro,
      logout,
      cambiarRolMock,
    }),
    [usuario, token, isLoading, login, registro, logout, cambiarRolMock],
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
