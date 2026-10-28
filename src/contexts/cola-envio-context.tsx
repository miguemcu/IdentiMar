import * as Network from 'expo-network';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, AppState } from 'react-native';
import { observacionesService } from '../services';
import {
  guardarCola,
  leerCola,
  nuevaEnCola,
  procesarCola,
  sinElemento,
  type ObservacionEnCola,
} from '../services/local/cola-envio';
import { hayRed } from '../services/local/red';
import { limpiarFotosEnviadas } from '../services/local/fotos';
import type { ImagenObservacion } from '../services/observaciones.service';
import type { ObservacionInput } from '../types';
import { useAuth } from './auth-context';

/**
 * Qué disparó un intento de envío de la cola. `reintento`: venció la espera
 * tras un error del servidor.
 */
export type OrigenEnvio = 'entrar' | 'manual' | 'senal' | 'volver' | 'reintento';

/** La señal y volver a la app avisan solos y pueden repetirse seguido. */
const AUTOMATICOS: OrigenEnvio[] = ['senal', 'volver'];

interface ColaEnvioContextType {
  /** Observaciones guardadas en el teléfono, en el orden en que se crearon. */
  cola: ObservacionEnCola[];
  enviando: boolean;
  /** Aviso de por qué se detuvo el último envío (no por falta de señal). */
  aviso: string | null;
  /** `quizaEnviada`: el envío se cortó por tiempo agotado y el servidor pudo crearla. */
  encolar: (datos: ObservacionInput, imagen: ImagenObservacion, quizaEnviada?: boolean) => void;
  /** Fotos de la cola en este momento (no las del último render). */
  fotosEnCola: () => string[];
  /** Intenta enviar ahora lo pendiente (también se hace solo al volver la señal). */
  enviarPendientes: (origen: OrigenEnvio) => Promise<void>;
  /** Vuelve a dejar en espera una observación que requería revisión. */
  reintentar: (idLocal: string) => void;
  descartar: (idLocal: string) => void;
}

/** Tras un intento, los avisos automáticos se ignoran durante este tiempo. */
const ESPERA_AUTOMATICA_MS = 5000;

const AVISO_SERVIDOR = 'El servidor no respondió bien. Lo intentaremos de nuevo más tarde.';

const ColaEnvioContext = createContext<ColaEnvioContextType | undefined>(undefined);

/**
 * Cola de envío por usuario. Se envía al entrar, al volver la señal y al
 * volver a la app. Solo una pasada a la vez, para no repetir envíos.
 */
export function ColaEnvioProvider({ children }: { children: React.ReactNode }) {
  const { usuario, logout } = useAuth();
  const usuarioId = usuario?.id;
  const [cola, setCola] = useState<ObservacionEnCola[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const colaRef = useRef<ObservacionEnCola[]>([]);
  const enCurso = useRef(false);
  // Fin del último intento: la señal y el volver a la app pueden avisar varias
  // veces seguidas, y cada aviso no debe contar como un intento más.
  const ultimoIntento = useRef(0);
  // logout cambia con cada usuario; por referencia no vuelve a crear
  // enviarPendientes ni a disparar el envío "al entrar".
  const logoutRef = useRef(logout);
  useEffect(() => {
    logoutRef.current = logout;
  }, [logout]);
  // Reintento programado tras un error del servidor (espera creciente).
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const enviarRef = useRef<(origen: OrigenEnvio) => Promise<void>>(async () => undefined);

  const actualizar = useCallback(
    (nueva: ObservacionEnCola[]) => {
      colaRef.current = nueva;
      setCola(nueva);
      if (usuarioId) guardarCola(usuarioId, nueva);
    },
    [usuarioId],
  );

  const enviarPendientes = useCallback(async (origen: OrigenEnvio) => {
    if (!usuarioId || enCurso.current) return;
    if (AUTOMATICOS.includes(origen) && Date.now() - ultimoIntento.current < ESPERA_AUTOMATICA_MS) {
      return;
    }
    if (!colaRef.current.some((e) => e.estado === 'pendiente_envio')) return;
    // Se marca antes de esperar la red: así otra llamada no entra mientras tanto.
    enCurso.current = true;
    if (!(await hayRed())) {
      enCurso.current = false;
      return;
    }
    setEnviando(true);
    clearTimeout(temporizador.current);
    try {
      const resultado = await procesarCola(colaRef.current, observacionesService, {
        forzar: origen === 'manual',
      });
      actualizar(resultado.cola);
      if (resultado.enviadas > 0) {
        limpiarFotosEnviadas(colaRef.current.map((e) => e.imagen.uri));
      }
      const esperando = resultado.detenidaPor === 'error' || resultado.detenidaPor === 'espera';
      setAviso(esperando ? AVISO_SERVIDOR : null);
      if (esperando && resultado.reintentarEn) {
        const espera = Math.max(0, Date.parse(resultado.reintentarEn) - Date.now());
        temporizador.current = setTimeout(() => void enviarRef.current('reintento'), espera);
      }
      // Sesión vencida: se vuelve a inicio de sesión como en el resto de la
      // app. La cola queda guardada para esta cuenta y se envía al volver a entrar.
      if (resultado.detenidaPor === 'sesion') void logoutRef.current('sesion-vencida');
      if (resultado.nuevasEnRevision > 0) {
        Alert.alert(
          'Revisa tus observaciones guardadas',
          'Una observación guardada no se pudo enviar. En Registros verás cuál es y qué hacer.',
        );
      }
    } finally {
      ultimoIntento.current = Date.now();
      enCurso.current = false;
      setEnviando(false);
    }
  }, [usuarioId, actualizar]);

  useEffect(() => {
    enviarRef.current = enviarPendientes;
  }, [enviarPendientes]);

  // Al entrar con una cuenta se lee su cola y se intenta enviar.
  useEffect(() => {
    let activo = true;
    colaRef.current = [];
    clearTimeout(temporizador.current);
    if (!usuarioId) {
      // Sin sesión no se lee ni se envía ninguna cola.
      queueMicrotask(() => {
        setCola([]);
        setAviso(null);
      });
      return;
    }
    void leerCola(usuarioId).then((guardada) => {
      if (!activo) return;
      colaRef.current = guardada;
      setCola(guardada);
      void enviarPendientes('entrar');
    });
    return () => {
      activo = false;
      clearTimeout(temporizador.current);
    };
  }, [usuarioId, enviarPendientes]);

  // Al volver la señal o volver a la app, se reintenta.
  useEffect(() => {
    const red = Network.addNetworkStateListener((estado) => {
      if (estado.isInternetReachable ?? estado.isConnected) void enviarPendientes('senal');
    });
    const app = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') void enviarPendientes('volver');
    });
    return () => {
      red.remove();
      app.remove();
    };
  }, [enviarPendientes]);

  const encolar = useCallback(
    (datos: ObservacionInput, imagen: ImagenObservacion, quizaEnviada = false) => {
      actualizar([...colaRef.current, nuevaEnCola(datos, imagen, quizaEnviada)]);
    },
    [actualizar],
  );

  const fotosEnCola = useCallback(() => colaRef.current.map((e) => e.imagen.uri), []);

  const reintentar = useCallback(
    (idLocal: string) => {
      actualizar(
        colaRef.current.map((e) =>
          e.idLocal === idLocal
            ? { ...e, estado: 'pendiente_envio', motivo: null, intentos: 0, proximoIntento: null }
            : e,
        ),
      );
      void enviarPendientes('manual');
    },
    [actualizar, enviarPendientes],
  );

  const descartar = useCallback(
    (idLocal: string) => actualizar(sinElemento(colaRef.current, idLocal)),
    [actualizar],
  );

  const valor = useMemo(
    () => ({ cola, enviando, aviso, encolar, fotosEnCola, enviarPendientes, reintentar, descartar }),
    [cola, enviando, aviso, encolar, fotosEnCola, enviarPendientes, reintentar, descartar],
  );

  return <ColaEnvioContext.Provider value={valor}>{children}</ColaEnvioContext.Provider>;
}

export function useColaEnvio(): ColaEnvioContextType {
  const contexto = useContext(ColaEnvioContext);
  if (!contexto) {
    throw new Error('useColaEnvio debe usarse dentro de un ColaEnvioProvider');
  }
  return contexto;
}

/** Para la pantalla de envío: decide antes de enviar si hay red real. */
export { hayRed };
