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

/** Nombres amigables de los campos de ObservacionInput para los errores 400. */
const ETIQUETA_CAMPO: Record<string, string> = {
  fecha_hora_evento: 'Fecha y hora',
  latitud: 'Latitud',
  longitud: 'Longitud',
  precision_gps_metros: 'Precisión del GPS',
  tipo_ambiente: 'Tipo de ambiente',
  condicion_organismo: 'Estado del animal',
  observaciones_usuario: 'Notas',
  imagen: 'Foto',
};

/** Traduce cualquier error de un servicio a un mensaje en español para el usuario. */
export function mensajeError(error: unknown): string {
  if (!(error instanceof ErrorServicio)) {
    return 'Algo salió mal. Inténtalo de nuevo.';
  }

  switch (error.status) {
    case 0:
      return 'No tienes internet en este momento. Inténtalo de nuevo cuando tengas señal.';
    case 400: {
      const problemas = (error.cuerpo.detalles ?? [])
        .filter((d) => d.problema)
        .map((d) => `${ETIQUETA_CAMPO[d.campo ?? ''] ?? 'Dato'}: ${d.problema}`);
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

const CAMPOS_AUTH: CampoAuth[] = ['nombre_completo', 'correo', 'password', 'telefono'];

/**
 * Traduce un error de inicio de sesión o registro a mensajes en español.
 * El contrato define 401 para el inicio de sesión y 400 y 409 para el registro.
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
        const campo = CAMPOS_AUTH.find((c) => c === d.campo);
        if (campo && d.problema) campos[campo] = d.problema;
      }
      return { general: 'Revisa los datos marcados en rojo.', campos };
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
