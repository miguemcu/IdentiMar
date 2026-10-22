import type {
  ObservacionInput,
  ObservacionResumen,
  ObservacionDetalle,
  ObservacionesPagina,
  EstadoObservacion,
} from '../types';

export interface FiltrosListadoObservaciones {
  estado?: EstadoObservacion;
  pagina?: number;
  tamano?: number;
}

/** Archivo que viaja en la parte `imagen` del multipart de POST /observaciones. */
export interface ImagenObservacion {
  uri: string;
  mimeType: 'image/jpeg' | 'image/png';
  nombre: string;
}

export interface IObservacionesService {
  /** Lanza ErrorServicio con status 400, 401, 413 o 0 (sin conexión). */
  crearObservacion(
    datos: ObservacionInput,
    imagen: ImagenObservacion
  ): Promise<ObservacionResumen>;
  listarObservaciones(
    filtros?: FiltrosListadoObservaciones
  ): Promise<ObservacionesPagina>;
  obtenerObservacion(id: string): Promise<ObservacionDetalle>;
  listarPendientes(
    filtros?: Omit<FiltrosListadoObservaciones, 'estado'>
  ): Promise<ObservacionesPagina>;
}
