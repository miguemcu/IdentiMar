import type {
  ObservacionDetalle,
  ObservacionesPagina,
  ObservacionInput,
  ObservacionResumen,
} from '../../types';
import type {
  FiltrosListadoObservaciones,
  ImagenObservacion,
  IObservacionesService,
} from '../observaciones.service';
import { aDetalle, aPagina, aResumen } from './adaptadores';
import { pedir } from './http';

export class ObservacionesApiService implements IObservacionesService {
  // POST /observaciones con multipart/form-data: `datos` (ObservacionInput en
  // JSON) e `imagen`. 201 -> ObservacionResumen; 400, 401 y 413.
  async crearObservacion(
    datos: ObservacionInput,
    imagen: ImagenObservacion,
  ): Promise<ObservacionResumen> {
    // El backend pide los códigos como tipo_ambiente_codigo y
    // condicion_organismo_codigo; se envían también con los nombres del
    // contrato, que el backend ignora.
    const cuerpo = {
      ...datos,
      tipo_ambiente_codigo: datos.tipo_ambiente,
      condicion_organismo_codigo: datos.condicion_organismo,
    };
    const formulario = new FormData();
    formulario.append('datos', JSON.stringify(cuerpo));
    // Desde SDK 58 el fetch global es el de Expo, que no acepta archivos como
    // `{ uri }` (los de React Native) y falla antes de enviar. Lee el contenido
    // con `bytes()` y toma `name` y `type` para la parte. Se dejan las dos
    // formas: `uri` sirve si se vuelve al fetch de React Native
    // (EXPO_PUBLIC_USE_RN_FETCH). El módulo se carga aquí para que el mock
    // (scripts/probar-servicios.ts) siga corriendo en Node.
    const { File } = await import('expo-file-system');
    const archivo = new File(imagen.uri);
    formulario.append('imagen', {
      uri: imagen.uri,
      type: imagen.mimeType,
      name: imagen.nombre,
      bytes: async () => new Uint8Array(await archivo.arrayBuffer()),
    } as unknown as Blob);
    return aResumen(await pedir('/observaciones', { metodo: 'POST', cuerpo: formulario }));
  }

  // GET /observaciones: solo las del usuario en sesión (el administrador ve todas).
  async listarObservaciones(
    filtros: FiltrosListadoObservaciones = {},
  ): Promise<ObservacionesPagina> {
    return aPagina(
      await pedir('/observaciones', {
        consulta: { estado: filtros.estado, pagina: filtros.pagina, tamano: filtros.tamano },
      }),
    );
  }

  // GET /observaciones/{id}. 200; 401, 403 y 404.
  async obtenerObservacion(id: string): Promise<ObservacionDetalle> {
    return aDetalle(await pedir(`/observaciones/${encodeURIComponent(id)}`));
  }

  // GET /observaciones/pendientes: solo experto o administrador (403 si no).
  async listarPendientes(
    filtros: Omit<FiltrosListadoObservaciones, 'estado'> = {},
  ): Promise<ObservacionesPagina> {
    return aPagina(
      await pedir('/observaciones/pendientes', {
        consulta: { pagina: filtros.pagina, tamano: filtros.tamano },
      }),
    );
  }
}
