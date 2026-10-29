import type { ICatalogosService } from '../catalogos.service';
import type {
  Especie,
  Familia,
  CatalogoItem,
  CatalogoEstadoItem,
} from '../../types';
import { ErrorServicio } from '../errores';
import { lanzarSiSinRed, simularRetardo } from './delay';
import {
  MOCK_ESPECIES,
  MOCK_FAMILIAS,
  MOCK_TIPOS_AMBIENTE,
  MOCK_CONDICIONES_ORGANISMO,
  MOCK_ESTADOS,
} from './mockData';

export class CatalogosMockService implements ICatalogosService {
  async obtenerEspecies(): Promise<Especie[]> {
    await simularRetardo();
    lanzarSiSinRed();
    return [...MOCK_ESPECIES];
  }

  async obtenerFamilias(): Promise<Familia[]> {
    await simularRetardo();
    lanzarSiSinRed();
    // EXPO_PUBLIC_MOCK_ERROR=familias: /catalogos/familias no responde.
    if (process.env.EXPO_PUBLIC_MOCK_ERROR === 'familias') {
      throw new ErrorServicio(0, { codigo: 'sin-conexion', mensaje: 'No hay conexión.' });
    }
    return [...MOCK_FAMILIAS];
  }

  async obtenerTiposAmbiente(): Promise<CatalogoItem[]> {
    await simularRetardo();
    lanzarSiSinRed();
    return [...MOCK_TIPOS_AMBIENTE];
  }

  async obtenerCondicionesOrganismo(): Promise<CatalogoItem[]> {
    await simularRetardo();
    lanzarSiSinRed();
    return [...MOCK_CONDICIONES_ORGANISMO];
  }

  async obtenerEstados(): Promise<CatalogoEstadoItem[]> {
    await simularRetardo();
    lanzarSiSinRed();
    return [...MOCK_ESTADOS];
  }
}
