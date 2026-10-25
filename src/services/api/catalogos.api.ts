import type {
  CatalogoEstadoItem,
  CatalogoItem,
  Especie,
  Familia,
} from '../../types';
import type { ICatalogosService } from '../catalogos.service';
import { noIntegrada } from './no-integrada';

/**
 * Esqueleto de la implementación real (H2). No hace llamadas de red todavía.
 * Todos son GET sin cuerpo; 200 -> arreglo del tipo indicado.
 */
export class CatalogosApiService implements ICatalogosService {
  // GET /catalogos/especies -> Especie[]
  async obtenerEspecies(): Promise<Especie[]> {
    throw noIntegrada('GET /catalogos/especies');
  }

  // GET /catalogos/familias -> Familia[]
  async obtenerFamilias(): Promise<Familia[]> {
    throw noIntegrada('GET /catalogos/familias');
  }

  // GET /catalogos/tipos-ambiente -> CatalogoItem[]
  async obtenerTiposAmbiente(): Promise<CatalogoItem[]> {
    throw noIntegrada('GET /catalogos/tipos-ambiente');
  }

  // GET /catalogos/condiciones-organismo -> CatalogoItem[]
  async obtenerCondicionesOrganismo(): Promise<CatalogoItem[]> {
    throw noIntegrada('GET /catalogos/condiciones-organismo');
  }

  // GET /catalogos/estados -> CatalogoEstadoItem[]
  async obtenerEstados(): Promise<CatalogoEstadoItem[]> {
    throw noIntegrada('GET /catalogos/estados');
  }
}
