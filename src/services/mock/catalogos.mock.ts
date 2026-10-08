import type {
  CatalogoEstadoItem,
  CatalogoItem,
  Especie,
  Familia,
} from "../../types";
import type { ICatalogosService } from "../catalogos.service";
import { simularRetardo } from "./delay";
import {
  MOCK_CONDICIONES_ORGANISMO,
  MOCK_ESPECIES,
  MOCK_ESTADOS,
  MOCK_FAMILIAS,
  MOCK_TIPOS_AMBIENTE,
} from "./mockData";

export class CatalogosMockService implements ICatalogosService {
  async obtenerEspecies(): Promise<Especie[]> {
    await simularRetardo();
    return [...MOCK_ESPECIES];
  }

  async obtenerFamilias(): Promise<Familia[]> {
    await simularRetardo();
    return [...MOCK_FAMILIAS];
  }

  async obtenerTiposAmbiente(): Promise<CatalogoItem[]> {
    await simularRetardo();
    return [...MOCK_TIPOS_AMBIENTE];
  }

  async obtenerCondicionesOrganismo(): Promise<CatalogoItem[]> {
    await simularRetardo();
    return [...MOCK_CONDICIONES_ORGANISMO];
  }

  async obtenerEstados(): Promise<CatalogoEstadoItem[]> {
    await simularRetardo();
    return [...MOCK_ESTADOS];
  }
}
