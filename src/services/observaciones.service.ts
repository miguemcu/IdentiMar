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

export interface IObservacionesService {
  crearObservacion(
    datos: ObservacionInput,
    imagenUri?: string
  ): Promise<ObservacionResumen>;
  listarObservaciones(
    filtros?: FiltrosListadoObservaciones
  ): Promise<ObservacionesPagina>;
  obtenerObservacion(id: string): Promise<ObservacionDetalle>;
  listarPendientes(
    filtros?: Omit<FiltrosListadoObservaciones, 'estado'>
  ): Promise<ObservacionesPagina>;
}
