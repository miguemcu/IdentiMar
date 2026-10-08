import type {
  Especie,
  Familia,
  CatalogoItem,
  CatalogoEstadoItem,
} from '../types';

export interface ICatalogosService {
  obtenerEspecies(): Promise<Especie[]>;
  obtenerFamilias(): Promise<Familia[]>;
  obtenerTiposAmbiente(): Promise<CatalogoItem[]>;
  obtenerCondicionesOrganismo(): Promise<CatalogoItem[]>;
  obtenerEstados(): Promise<CatalogoEstadoItem[]>;
}
