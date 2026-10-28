import type { ErrorApi } from '../types';

/**
 * Error de un servicio con el status HTTP y el cuerpo `Error` del contrato.
 * `status` 0 significa que no hubo respuesta (sin conexión).
 */
export class ErrorServicio extends Error {
  readonly status: number;
  readonly cuerpo: ErrorApi;

  constructor(status: number, cuerpo: ErrorApi) {
    super(cuerpo.mensaje);
    this.name = 'ErrorServicio';
    this.status = status;
    this.cuerpo = cuerpo;
  }
}

/**
 * Texto en español para cada campo de ObservacionInput con error 400. El
 * backend explica el problema en inglés ("Required"), así que la app usa los
 * suyos en vez de mostrar el texto que llega.
 */
const PROBLEMA_CAMPO: Record<string, string> = {
  fecha_hora_evento: 'Fecha y hora: revisa que sea una fecha válida.',
  latitud: 'Latitud: revisa el número que escribiste.',
  longitud: 'Longitud: revisa el número que escribiste.',
  precision_gps_metros: 'Ubicación: vuelve a tomar tu ubicación.',
  tipo_ambiente: 'Tipo de ambiente: elige una opción.',
  condicion_organismo: 'Estado del animal: elige una opción.',
  observaciones_usuario: 'Notas: el texto es muy largo, acórtalo un poco.',
  imagen: 'Foto: no pudimos usarla, prueba con otra.',
};

/** El backend puede nombrar el campo con su ruta (`datos.latitud`); se usa el último tramo. */
function nombreCampo(campo: string | undefined): string {
  return (campo ?? '').split('.').pop() ?? '';
}

/** Traduce cualquier error de un servicio a un mensaje en español para el usuario. */
export function mensajeError(error: unknown): string {
  if (!(error instanceof ErrorServicio)) {
    return 'Algo salió mal. Inténtalo de nuevo.';
  }

  switch (error.status) {
    case 0:
      return 'No tienes internet en este momento. Inténtalo de nuevo cuando tengas señal.';
    case 400: {
      const problemas = [
        ...new Set(
          (error.cuerpo.detalles ?? [])
            .map((d) => PROBLEMA_CAMPO[nombreCampo(d.campo)])
            .filter((texto): texto is string => Boolean(texto)),
        ),
      ];
      return problemas.length > 0
        ? `Revisa estos datos:\n${problemas.join('\n')}`
        : 'Algunos datos no son válidos. Revísalos e inténtalo de nuevo.';
    }
    case 401:
      return 'Tu sesión expiró. Vuelve a iniciar sesión.';
    case 413:
      return 'La foto pesa demasiado. Toma otra o elige una más liviana.';
    default:
      return 'Algo falló de nuestro lado. Inténtalo más tarde.';
  }
}

/** Campos de los formularios de inicio de sesión y registro. */
export type CampoAuth = 'nombre_completo' | 'correo' | 'password' | 'telefono';

export interface ErroresAuth {
  general: string;
  campos: Partial<Record<CampoAuth, string>>;
}

/** Texto en español para cada campo de los formularios con error 400. */
const PROBLEMA_AUTH: Record<CampoAuth, string> = {
  nombre_completo: 'Escribe tu nombre completo.',
  correo: 'Revisa el correo. Debe verse así: nombre@correo.com',
  password: 'La contraseña debe tener al menos 8 letras o números.',
  telefono: 'Revisa el número de teléfono.',
};

/**
 * Traduce un error de inicio de sesión o registro a mensajes en español.
 * El contrato define 401 para el inicio de sesión y 400 y 409 para el
 * registro; el backend desplegado también responde 400 en el inicio de sesión.
 */
export function erroresAuth(error: unknown, flujo: 'login' | 'registro'): ErroresAuth {
  if (!(error instanceof ErrorServicio)) {
    return {
      general: 'No pudimos conectarnos en este momento. Inténtalo más tarde.',
      campos: {},
    };
  }

  switch (error.status) {
    case 0:
      return { general: mensajeError(error), campos: {} };
    case 400: {
      const campos: ErroresAuth['campos'] = {};
      for (const d of error.cuerpo.detalles ?? []) {
        const campo = nombreCampo(d.campo);
        if (campo in PROBLEMA_AUTH) campos[campo as CampoAuth] = PROBLEMA_AUTH[campo as CampoAuth];
      }
      return {
        general:
          Object.keys(campos).length > 0
            ? 'Revisa los datos marcados en rojo.'
            : 'Algunos datos no son válidos. Revísalos e inténtalo de nuevo.',
        campos,
      };
    }
    case 401:
      return flujo === 'login'
        ? { general: 'El correo o la contraseña no coinciden.', campos: {} }
        : { general: mensajeError(error), campos: {} };
    case 409:
      return {
        general: 'Ya hay una cuenta con ese correo. Intenta entrar con él.',
        campos: { correo: 'Este correo ya está registrado.' },
      };
    default:
      return { general: mensajeError(error), campos: {} };
  }
}

export interface ErrorValidacion {
  mensaje: string;
  /** 409: la observación cambió; conviene volver a pedir el detalle. */
  recargar: boolean;
  /** 401: hay que volver a iniciar sesión. */
  sesionVencida: boolean;
}

/**
 * Traduce un error de POST /observaciones/{id}/validacion a un mensaje en español.
 * El contrato define 400, 401, 403, 404 y 409.
 */
export function erroresValidacion(error: unknown): ErrorValidacion {
  const resultado = (mensaje: string, extra: Partial<ErrorValidacion> = {}) => ({
    mensaje,
    recargar: false,
    sesionVencida: false,
    ...extra,
  });

  if (!(error instanceof ErrorServicio)) {
    return resultado('No pudimos guardar tu decisión en este momento. Inténtalo más tarde.');
  }

  switch (error.status) {
    case 400:
      return resultado('Revisa el comentario o la especie elegida e inténtalo de nuevo.');
    case 401:
      return resultado(mensajeError(error), { sesionVencida: true });
    case 403:
      return resultado('No tienes permiso para validar observaciones.');
    case 404:
      return resultado('No encontramos esta observación. Puede que ya no exista.');
    case 409:
      return resultado(
        'Esta observación ya no se puede validar: puede que otro experto ya la haya revisado.',
        { recargar: true },
      );
    default:
      return resultado(mensajeError(error));
  }
}
