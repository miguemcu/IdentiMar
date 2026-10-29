import type {
  CatalogoEstadoItem,
  CatalogoItem,
  Especie,
  Familia,
} from '../../types';
import type { ICatalogosService } from '../catalogos.service';
import { pedir } from './http';

/**
 * Catálogos: GET sin token que devuelven un arreglo. Las pantallas los guardan
 * en caché (local/cache.ts) y filtran `grupo: raya` donde corresponde.
 */
const catalogo = <T>(ruta: string) => pedir<T[]>(`/catalogos/${ruta}`, { conToken: false });

export class CatalogosApiService implements ICatalogosService {
  async obtenerEspecies(): Promise<Especie[]> {
    // Algunas descripciones llegan con espacios o saltos de línea al inicio o
    // al final, que en la ficha se verían como renglones vacíos.
    const especies = await catalogo<Especie>('especies');
    return especies.map((e) => ({ ...e, descripcion: e.descripcion?.trim() || null }));
  }

  async obtenerFamilias(): Promise<Familia[]> {
    return catalogo<Familia>('familias');
  }

  async obtenerTiposAmbiente(): Promise<CatalogoItem[]> {
    return catalogo<CatalogoItem>('tipos-ambiente');
  }

  async obtenerCondicionesOrganismo(): Promise<CatalogoItem[]> {
    return catalogo<CatalogoItem>('condiciones-organismo');
  }

  async obtenerEstados(): Promise<CatalogoEstadoItem[]> {
    return catalogo<CatalogoEstadoItem>('estados');
  }
}
