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
  /**
   * El último envío se cortó por tiempo agotado: el servidor pudo haberla
   * creado. Antes de reenviarla se busca en GET /observaciones.
   */
  quizaEnviada?: boolean;
  /** Tras un error del servidor, no se reintenta antes de esta fecha (ISO 8601). */
  proximoIntento?: string | null;
}

/** Fallos (500 u otros) tras los que un elemento deja de bloquear la cola. */
export const MAX_INTENTOS = 3;

/** Espera tras el primer error del servidor; se duplica con cada intento. */
const ESPERA_BASE_MS = 15_000;

/**
 * Margen para reconocer una observación ya creada: el servidor la registra al
 * empezar el envío, que pudo tardar hasta el tiempo máximo de espera antes de
 * guardarla en la cola.
 */
const MARGEN_CREACION_MS = 5 * 60 * 1000;

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
  quizaEnviada = false,
): ObservacionEnCola {
  return {
    idLocal: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    creadoEn: new Date().toISOString(),
    estado: 'pendiente_envio',
    datos,
    imagen,
    motivo: null,
    intentos: 0,
    quizaEnviada,
    proximoIntento: null,
  };
}

/** true si el error significa que no hubo respuesta (sin conexión). */
export function esSinConexion(error: unknown): boolean {
  return error instanceof ErrorServicio && error.status === 0;
}

/**
 * true si el envío se cortó por tiempo agotado: hubo conexión, pero no llegó
 * la respuesta, así que el servidor pudo haber creado la observación.
 */
export function esTiempoAgotado(error: unknown): boolean {
  return esSinConexion(error) && (error as ErrorServicio).cuerpo.codigo === 'tiempo-agotado';
}

/**
 * Busca en las observaciones recientes del usuario una con la misma fecha y
 * hora del evento (el backend la guarda en UTC: se compara el instante),
 * creada desde poco antes de guardarla en la cola. El listado del contrato no
 * trae las coordenadas.
 */
async function yaFueCreada(
  elemento: ObservacionEnCola,
  servicio: IObservacionesService,
): Promise<boolean> {
  const evento = Date.parse(elemento.datos.fecha_hora_evento);
  const desde = Date.parse(elemento.creadoEn) - MARGEN_CREACION_MS;
  const { items } = await servicio.listarObservaciones({ tamano: 20 });
  return items.some(
    (obs) =>
      !!obs.fecha_hora_evento &&
      Date.parse(obs.fecha_hora_evento) === evento &&
      Date.parse(obs.creado_en) >= desde,
  );
}

export interface ResultadoProceso {
  cola: ObservacionEnCola[];
  enviadas: number;
  /** Elementos que pasaron a `requiere_revision` en esta pasada. */
  nuevasEnRevision: number;
  /**
   * Por qué se detuvo antes de terminar, si fue así. `espera`: el primer
   * pendiente aún está esperando para reintentar tras un error del servidor.
   */
  detenidaPor: 'sin_conexion' | 'sesion' | 'error' | 'espera' | null;
  /** Con `error` o `espera`: cuándo conviene volver a intentar (ISO 8601). */
  reintentarEn: string | null;
}

/**
 * Envía la cola en el orden en que se creó.
 *
 * `i` apunta al primer elemento sin revisar en esta pasada. Si se envía, se
 * quita con splice y el siguiente queda en `i`, así que `i` no avanza; en los
 * demás casos `i` avanza. Cada vuelta quita un elemento o avanza `i`.
 *
 * - Si el envío anterior se cortó por tiempo agotado (`quizaEnviada`), antes
 *   de reenviar se busca en GET /observaciones; si ya está, se quita sin
 *   reenviar (el contrato no tiene idempotencia).
 * - Sin conexión (status 0) o sesión vencida (401): se detiene y conserva el
 *   resto, sin sumar intentos. Un tiempo agotado marca `quizaEnviada`.
 * - 400 o 413, o la foto ya no existe: pasa a revisión y se sigue con el siguiente.
 * - Otro error (500 u otros): suma un intento, programa el siguiente con
 *   espera creciente (15 s, 30 s) y se detiene. Al llegar a MAX_INTENTOS pasa
 *   a revisión, para no bloquear la cola para siempre.
 * - `forzar` (botón "Enviar ahora") no respeta la espera.
 */
export async function procesarCola(
  cola: ObservacionEnCola[],
  servicio: IObservacionesService,
  { forzar = false }: { forzar?: boolean } = {},
): Promise<ResultadoProceso> {
  const restante = [...cola].sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
  let enviadas = 0;
  let nuevasEnRevision = 0;
  const resultado = (
    detenidaPor: ResultadoProceso['detenidaPor'],
    reintentarEn: string | null = null,
  ): ResultadoProceso => ({ cola: restante, enviadas, nuevasEnRevision, detenidaPor, reintentarEn });
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
    if (!forzar && elemento.proximoIntento && Date.parse(elemento.proximoIntento) > Date.now()) {
      return resultado('espera', elemento.proximoIntento);
    }
    // Colas guardadas antes de existir el campo no lo traen.
    const intentos = elemento.intentos ?? 0;
    try {
      // Va antes de revisar la foto: si ya se creó, la foto no hace falta.
      if (elemento.quizaEnviada && (await yaFueCreada(elemento, servicio))) {
        restante.splice(i, 1);
        enviadas += 1;
        continue;
      }
      if (!fotoExiste(elemento.imagen.uri)) {
        aRevision(i, MOTIVO_FOTO_AUSENTE, intentos);
        i += 1;
        continue;
      }
      await servicio.crearObservacion(elemento.datos, elemento.imagen);
      restante.splice(i, 1);
      enviadas += 1;
    } catch (error) {
      const status = error instanceof ErrorServicio ? error.status : -1;
      if (status === 0 || status === 401) {
        if (esTiempoAgotado(error)) restante[i] = { ...elemento, quizaEnviada: true };
        return resultado(status === 0 ? 'sin_conexion' : 'sesion');
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
      const proximoIntento = new Date(
        Date.now() + ESPERA_BASE_MS * 2 ** intentos,
      ).toISOString();
      restante[i] = { ...elemento, intentos: intentos + 1, proximoIntento };
      return resultado('error', proximoIntento);
    }
  }
  return resultado(null);
}

/** Quita un elemento de la cola y su foto reservada. */
export function sinElemento(cola: ObservacionEnCola[], idLocal: string): ObservacionEnCola[] {
  const elemento = cola.find((e) => e.idLocal === idLocal);
  if (elemento) liberarFotoReservada(elemento.imagen.uri);
  return cola.filter((e) => e.idLocal !== idLocal);
}
