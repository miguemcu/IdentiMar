import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService } from '../services';
import {
  actualizarUsuarioSesion,
  alVencerSesion,
  borrarSesion,
  guardarSesion,
  leerSesionGuardada,
} from '../services/api/sesion';
import { borrarBorrador } from '../services/local/borrador';
import { borrarCacheUsuario } from '../services/local/cache';
import type {
  UsuarioPublico,
  Rol,
  LoginRequest,
  LoginResponse,
  RegistroRequest,
} from '../types';

/** Por qué se cerró la sesión sin que el usuario lo pidiera. */
export type MotivoCierre = 'sesion-vencida';

const AVISO_CIERRE: Record<MotivoCierre, string> = {
  'sesion-vencida': 'Tu sesión venció, vuelve a entrar.',
};

interface AuthContextType {
  usuario: UsuarioPublico | null;
  rol: Rol | null;
  isLoading: boolean;
  /** Aviso para la pantalla de inicio de sesión tras un cierre automático. */
  avisoSesion: string | null;
  login: (datos: LoginRequest) => Promise<void>;
  registro: (datos: RegistroRequest) => Promise<void>;
  logout: (motivo?: MotivoCierre) => Promise<void>;
  /** Datos más recientes de la cuenta en sesión (por ejemplo, desde /auth/perfil). */
  actualizarUsuario: (datos: UsuarioPublico) => void;
  cambiarRolMock: (rol: Rol) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Sesión de la app. Los tokens viven en services/api/sesion.ts, donde los lee
 * el cliente HTTP; con la API también se guardan cifrados en el teléfono.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioPublico | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [avisoSesion, setAvisoSesion] = useState<string | null>(null);

  const actualizarUsuario = useCallback((datos: UsuarioPublico) => {
    // Solo si es la misma cuenta y cambió algo: así no se vuelve a dibujar la
    // app con cada consulta del perfil.
    setUsuario((actual) =>
      actual && actual.id === datos.id && JSON.stringify(actual) !== JSON.stringify(datos)
        ? datos
        : actual,
    );
  }, []);

  // La sesión guardada lleva siempre los datos más recientes del usuario.
  useEffect(() => {
    if (usuario) actualizarUsuarioSesion(usuario);
  }, [usuario]);

  useEffect(() => {
    // Con la API se entra directo con la sesión guardada, sin consultar la red:
    // así también se abre sin señal. La primera petición que reciba un 401
    // renueva la sesión sola; si no se puede, avisa y se vuelve a entrar.
    let activo = true;
    void leerSesionGuardada().then((guardada) => {
      if (!activo) return;
      if (guardada) setUsuario(guardada.usuario);
      setIsLoading(false);
      // Con señal, se traen los datos al día (por ejemplo, un rol nuevo).
      if (guardada) {
        authService
          .obtenerPerfil()
          .then((perfil) => {
            if (activo) actualizarUsuario(perfil);
          })
          .catch(() => undefined);
      }
    });
    return () => {
      activo = false;
    };
  }, [actualizarUsuario]);

  const iniciar = useCallback((resp: LoginResponse) => {
    guardarSesion(resp);
    setUsuario(resp.usuario);
  }, []);

  const login = useCallback(async (datos: LoginRequest) => {
    setIsLoading(true);
    setAvisoSesion(null);
    try {
      iniciar(await authService.login(datos));
    } finally {
      setIsLoading(false);
    }
  }, [iniciar]);

  const registro = useCallback(async (datos: RegistroRequest) => {
    setIsLoading(true);
    try {
      // El contrato responde 201 con UsuarioPublico, sin tokens: la sesión
      // se obtiene iniciando sesión con los mismos datos.
      await authService.registro(datos);
      iniciar(await authService.login({ correo: datos.correo, password: datos.password }));
    } finally {
      setIsLoading(false);
    }
  }, [iniciar]);

  const logout = useCallback(async (motivo?: MotivoCierre) => {
    setIsLoading(true);
    try {
      if (usuario) {
        // Al cerrar sesión a mano se descarta el borrador de esa cuenta. Si la
        // sesión venció (motivo), se conserva para no perder datos de campo.
        if (!motivo) borrarBorrador(usuario.id);
        // Sus registros guardados no quedan en el teléfono sin sesión. La cola
        // de envío sí se conserva: se envía al volver a entrar.
        borrarCacheUsuario(usuario.id);
      }
      borrarSesion();
      setAvisoSesion(motivo ? AVISO_CIERRE[motivo] : null);
      setUsuario(null);
    } finally {
      setIsLoading(false);
    }
  }, [usuario]);

  // La sesión venció y el cliente HTTP no pudo renovarla.
  useEffect(
    () => alVencerSesion(() => void logout('sesion-vencida')),
    [logout],
  );

  // No pasa por isLoading: así el cambio de rol vuelve a dibujar la app una
  // sola vez (con el nuevo usuario) en lugar de dos.
  const cambiarRolMock = useCallback(async (nuevoRol: Rol) => {
    const correo =
      nuevoRol === 'experto'
        ? 'carlos.mendoza@invemar.org.co'
        : nuevoRol === 'administrador'
          ? 'admin@identimar.udea.edu.co'
          : 'ana.torres@ejemplo.co';
    iniciar(await authService.login({ correo, password: 'password123' }));
  }, [iniciar]);

  // Valor estable: los componentes que usan useAuth solo se actualizan
  // cuando cambia algo de la sesión.
  const valor = useMemo<AuthContextType>(
    () => ({
      usuario,
      rol: usuario?.rol ?? null,
      isLoading,
      avisoSesion,
      login,
      registro,
      logout,
      actualizarUsuario,
      cambiarRolMock,
    }),
    [usuario, isLoading, avisoSesion, login, registro, logout, actualizarUsuario, cambiarRolMock],
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
