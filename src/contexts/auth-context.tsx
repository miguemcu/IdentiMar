import React, { createContext, useContext, useState, useEffect } from 'react';
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

  const login = async (datos: LoginRequest) => {
    setIsLoading(true);
    try {
      const resp = await authService.login(datos);
      setUsuario(resp.usuario);
      setToken(resp.access_token);
    } finally {
      setIsLoading(false);
    }
  };

  const registro = async (datos: RegistroRequest) => {
    setIsLoading(true);
    try {
      const nuevo = await authService.registro(datos);
      setUsuario(nuevo);
      setToken(`mock-token-${Date.now()}`);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      setUsuario(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const cambiarRolMock = async (nuevoRol: Rol) => {
    if (nuevoRol === 'experto') {
      await login({ correo: 'carlos.mendoza@invemar.org.co', password: 'password123' });
    } else if (nuevoRol === 'administrador') {
      await login({ correo: 'admin@identimar.udea.edu.co', password: 'password123' });
    } else {
      await login({ correo: 'ana.torres@ejemplo.co', password: 'password123' });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        rol: usuario?.rol ?? null,
        token,
        isLoading,
        login,
        registro,
        logout,
        cambiarRolMock,
      }}
    >
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
