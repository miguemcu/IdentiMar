import type { DetalleError, ErrorApi } from '../../types';
import { ErrorServicio } from '../errores';
import { API_URL, TIEMPO_ESPERA_MS } from './config';
import {
  actualizarTokens,
  avisarSesionVencida,
  tokenDeAcceso,
  tokenDeRenovacion,
} from './sesion';

/**
 * Registro en Metro solo en desarrollo. `__DEV__` no existe fuera de React
 * Native (por ejemplo, al probar los servicios con tsx en Node).
 */
const EN_DESARROLLO = typeof __DEV__ !== 'undefined' && __DEV__;

export interface OpcionesPeticion {
  metodo?: 'GET' | 'POST';
  /** Objeto que viaja como JSON, o FormData para multipart/form-data. */
  cuerpo?: unknown;
  /** Parámetros de consulta; los undefined se omiten. */
  consulta?: Record<string, string | number | undefined>;
  /** false para los endpoints sin token (registro, login, refresh, catálogos). */
  conToken?: boolean;
}

function construirUrl(ruta: string, consulta?: OpcionesPeticion['consulta']): string {
  const parametros = Object.entries(consulta ?? {})
    .filter(([, valor]) => valor !== undefined)
    .map(([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(String(valor))}`);
  return `${API_URL}${ruta}${parametros.length > 0 ? `?${parametros.join('&')}` : ''}`;
}

/**
 * `fetch` con tiempo máximo de espera. Sin respuesta (sin red o tiempo
 * agotado) lanza ErrorServicio con status 0, como el mock, para que la cola de
 * envío y la caché lo traten como "sin conexión".
 */
async function fetchConEspera(url: string, init: RequestInit): Promise<Response> {
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_ESPERA_MS);
  try {
    return await fetch(url, { ...init, signal: control.signal });
  } catch (error) {
    // Solo en desarrollo: el motivo real (por ejemplo, un cuerpo que fetch no
    // sabe enviar) para no confundirlo con falta de señal. Sin datos personales.
    if (EN_DESARROLLO && !control.signal.aborted) {
      console.warn('[IdentiMar] fetch falló:', error instanceof Error ? error.message : error);
    }
    throw new ErrorServicio(0, {
      codigo: control.signal.aborted ? 'tiempo-agotado' : 'sin-conexion',
      mensaje: 'No hay conexión.',
    });
  } finally {
    clearTimeout(temporizador);
  }
}

interface DetalleRecibido {
  campo?: string;
  problema?: string;
  mensaje?: string;
}

/**
 * Convierte el cuerpo de error a la forma `Error` del contrato. El backend lo
 * envía dentro de `error` y con `detalles[].mensaje` en vez de `problema`; se
 * aceptan las dos formas.
 */
async function leerError(respuesta: Response): Promise<ErrorApi> {
  let recibido: { codigo?: string; mensaje?: string; detalles?: DetalleRecibido[] | null } = {};
  try {
    const json = await respuesta.json();
    recibido = json?.error ?? json ?? {};
  } catch {
    // Sin cuerpo JSON: queda el error genérico de abajo.
  }
  const detalles: DetalleError[] | null = Array.isArray(recibido.detalles)
    ? recibido.detalles.map((d) => ({ campo: d.campo, problema: d.problema ?? d.mensaje }))
    : null;
  return {
    codigo: recibido.codigo ?? `http-${respuesta.status}`,
    mensaje: recibido.mensaje ?? 'El servidor no pudo atender la solicitud.',
    detalles,
  };
}

type ResultadoRenovacion = 'renovada' | 'rechazada' | 'sin-conexion';

/** Una sola renovación a la vez: si varias peticiones reciben 401, todas esperan la misma. */
let renovacionEnCurso: Promise<ResultadoRenovacion> | null = null;

function renovarSesion(): Promise<ResultadoRenovacion> {
  renovacionEnCurso ??= (async (): Promise<ResultadoRenovacion> => {
    const refreshToken = tokenDeRenovacion();
    if (!refreshToken) return 'rechazada';
    try {
      const respuesta = await fetchConEspera(construirUrl('/auth/refresh'), {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!respuesta.ok) return 'rechazada';
      actualizarTokens(await respuesta.json());
      return 'renovada';
    } catch (error) {
      return error instanceof ErrorServicio && error.status === 0 ? 'sin-conexion' : 'rechazada';
    }
  })().finally(() => {
    renovacionEnCurso = null;
  });
  return renovacionEnCurso;
}

/**
 * Petición a la API. Devuelve el JSON de la respuesta o lanza ErrorServicio
 * con el status y el cuerpo en la forma del contrato.
 *
 * Con token, un 401 renueva la sesión una vez con /auth/refresh y repite la
 * petición. Si la renovación es rechazada, avisa que la sesión venció y lanza
 * el 401; si no hubo conexión para renovar, lanza status 0.
 */
export async function pedir<T>(ruta: string, opciones: OpcionesPeticion = {}): Promise<T> {
  const { metodo = 'GET', cuerpo, consulta, conToken = true } = opciones;
  const esMultipart = typeof FormData !== 'undefined' && cuerpo instanceof FormData;

  const enviar = () => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    // En multipart, fetch pone el Content-Type con su boundary.
    if (cuerpo !== undefined && !esMultipart) headers['Content-Type'] = 'application/json';
    const token = conToken ? tokenDeAcceso() : null;
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetchConEspera(construirUrl(ruta, consulta), {
      method: metodo,
      headers,
      body:
        cuerpo === undefined
          ? undefined
          : esMultipart
            ? (cuerpo as FormData)
            : JSON.stringify(cuerpo),
    });
  };

  let respuesta = await enviar();

  if (respuesta.status === 401 && conToken && tokenDeRenovacion()) {
    const renovacion = await renovarSesion();
    if (renovacion === 'renovada') {
      respuesta = await enviar();
    } else if (renovacion === 'sin-conexion') {
      throw new ErrorServicio(0, { codigo: 'sin-conexion', mensaje: 'No hay conexión.' });
    }
  }

  if (!respuesta.ok) {
    const error = new ErrorServicio(respuesta.status, await leerError(respuesta));
    if (EN_DESARROLLO) {
      // Solo códigos y nombres de campo: nunca valores, tokens ni coordenadas.
      const campos = (error.cuerpo.detalles ?? []).map((d) => `${d.campo}: ${d.problema}`).join(' · ');
      console.warn(
        `[IdentiMar] ${metodo} ${ruta} → ${respuesta.status} ${error.cuerpo.codigo}${campos ? ` (${campos})` : ''}`,
      );
    }
    if (respuesta.status === 401 && conToken) avisarSesionVencida();
    throw error;
  }

  if (EN_DESARROLLO) console.log(`[IdentiMar] ${metodo} ${ruta} → ${respuesta.status}`);
  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
}
