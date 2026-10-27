import { File } from 'expo-file-system';
import type { ObservacionInput } from '@/types';
import { ErrorServicio } from '../errores';
import type { ImagenObservacion, IObservacionesService } from '../observaciones.service';
import { escribirJson, leerJson } from './almacen';
import { liberarFotoReservada } from './fotos';

/**
 * Estado del cliente, separado de `EstadoObservacion` del contrato: la
 * observación todavía no existe en el servidor.
 * - `pendiente_envio`: espera conexión para enviarse.
 * - `requiere_revision`: el servidor la rechazó (400 o 413); no se reintenta sola.
 */
export type EstadoEnvioLocal = 'pendiente_envio' | 'requiere_revision';

export interface ObservacionEnCola {
  idLocal: string;
  creadoEn: string;
  estado: EstadoEnvioLocal;
  datos: ObservacionInput;
  imagen: ImagenObservacion;
  /** Mensaje para el usuario cuando requiere revisión. */
  motivo: string | null;
  /**
   * Envíos fallidos por errores que no son de conexión ni de sesión. Se guarda
   * en el archivo de la cola, así sobrevive a cerrar la app.
   */
  intentos: number;
}

/** Fallos (500 u otros) tras los que un elemento deja de bloquear la cola. */
export const MAX_INTENTOS = 3;

export const MOTIVO_FOTO_AUSENTE = 'La foto de esta observación ya no está en el teléfono.';
export const MOTIVO_INTENTOS = 'No se pudo enviar después de varios intentos.';

function fotoExiste(uri: string): boolean {
  // EXPO_PUBLIC_MOCK_ERROR=foto-ausente: simula que la foto de la cola se borró.
  if (process.env.EXPO_PUBLIC_MOCK_ERROR === 'foto-ausente') return false;
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

/** Una cola por usuario: los tokens viven en memoria y solo esa cuenta puede enviarla. */
const nombre = (usuarioId: string) => `cola-${usuarioId}`;

export async function leerCola(usuarioId: string): Promise<ObservacionEnCola[]> {
  return (await leerJson<ObservacionEnCola[]>(nombre(usuarioId))) ?? [];
}

export function guardarCola(usuarioId: string, cola: ObservacionEnCola[]): boolean {
  return escribirJson(nombre(usuarioId), cola);
}

export function nuevaEnCola(
  datos: ObservacionInput,
  imagen: ImagenObservacion,
): ObservacionEnCola {
  return {
    idLocal: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    creadoEn: new Date().toISOString(),
    estado: 'pendiente_envio',
    datos,
    imagen,
    motivo: null,
    intentos: 0,
  };
}

/** true si el error significa que no hubo respuesta (sin conexión). */
export function esSinConexion(error: unknown): boolean {
  return error instanceof ErrorServicio && error.status === 0;
}

export interface ResultadoProceso {
  cola: ObservacionEnCola[];
  enviadas: number;
  /** Elementos que pasaron a `requiere_revision` en esta pasada. */
  nuevasEnRevision: number;
  /** Por qué se detuvo antes de terminar, si fue así. */
  detenidaPor: 'sin_conexion' | 'sesion' | 'error' | null;
}

/**
 * Envía la cola en el orden en que se creó.
 *
 * `i` apunta al primer elemento sin revisar en esta pasada. Si se envía, se
 * quita con splice y el siguiente queda en `i`, así que `i` no avanza; en los
 * demás casos `i` avanza. Cada vuelta quita un elemento o avanza `i`.
 *
 * - Sin conexión (status 0) o sesión vencida (401): se detiene y conserva el
 *   resto, sin sumar intentos.
 * - 400 o 413, o la foto ya no existe: pasa a revisión y se sigue con el siguiente.
 * - Otro error (500 u otros): suma un intento y se detiene. Al llegar a
 *   MAX_INTENTOS pasa a revisión, para no bloquear la cola para siempre.
 */
export async function procesarCola(
  cola: ObservacionEnCola[],
  servicio: IObservacionesService,
): Promise<ResultadoProceso> {
  const restante = [...cola].sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
  let enviadas = 0;
  let nuevasEnRevision = 0;
  const aRevision = (i: number, motivo: string, intentos: number) => {
    restante[i] = { ...restante[i], estado: 'requiere_revision', motivo, intentos };
    nuevasEnRevision += 1;
  };

  for (let i = 0; i < restante.length; ) {
    const elemento = restante[i];
    if (elemento.estado !== 'pendiente_envio') {
      i += 1;
      continue;
    }
    // Colas guardadas antes de existir el campo no lo traen.
    const intentos = elemento.intentos ?? 0;
    if (!fotoExiste(elemento.imagen.uri)) {
      aRevision(i, MOTIVO_FOTO_AUSENTE, intentos);
      i += 1;
      continue;
    }
    try {
      await servicio.crearObservacion(elemento.datos, elemento.imagen);
      restante.splice(i, 1);
      enviadas += 1;
    } catch (error) {
      const status = error instanceof ErrorServicio ? error.status : -1;
      if (status === 0 || status === 401) {
        return {
          cola: restante,
          enviadas,
          nuevasEnRevision,
          detenidaPor: status === 0 ? 'sin_conexion' : 'sesion',
        };
      }
      if (status === 400 || status === 413) {
        aRevision(
          i,
          status === 413
            ? 'La foto pesa demasiado para enviarla.'
            : 'Algunos datos no son válidos para el servidor.',
          intentos + 1,
        );
        i += 1;
        continue;
      }
      if (intentos + 1 >= MAX_INTENTOS) {
        aRevision(i, MOTIVO_INTENTOS, intentos + 1);
        i += 1;
        continue;
      }
      restante[i] = { ...elemento, intentos: intentos + 1 };
      return { cola: restante, enviadas, nuevasEnRevision, detenidaPor: 'error' };
    }
  }
  return { cola: restante, enviadas, nuevasEnRevision, detenidaPor: null };
}

/** Quita un elemento de la cola y su foto reservada. */
export function sinElemento(cola: ObservacionEnCola[], idLocal: string): ObservacionEnCola[] {
  const elemento = cola.find((e) => e.idLocal === idLocal);
  if (elemento) liberarFotoReservada(elemento.imagen.uri);
  return cola.filter((e) => e.idLocal !== idLocal);
}
