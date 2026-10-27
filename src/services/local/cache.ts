import { ErrorServicio } from '../errores';
import { escribirJson, leerJson } from './almacen';
import { esSinConexion } from './cola-envio';
import { hayRed } from './red';

interface EntradaCache<T> {
  datos: T;
  guardadoEn: string;
}

export interface ResultadoConCache<T> {
  datos: T;
  /** true si los datos vienen del teléfono porque no hubo conexión. */
  desdeCache: boolean;
  /** Cuándo se guardaron los datos mostrados (ISO 8601). */
  guardadoEn: string;
}

/**
 * Carga datos del servicio y guarda una copia en el teléfono. Sin conexión
 * (sin red real o sin respuesta), devuelve la última copia guardada. Si no hay
 * copia, lanza un ErrorServicio con status 0 para que la pantalla muestre su
 * mensaje de sin conexión, nunca un error técnico.
 */
export async function conCache<T>(
  clave: string,
  cargar: () => Promise<T>,
): Promise<ResultadoConCache<T>> {
  const nombre = `cache-${clave}`;
  const desdeTelefono = async (): Promise<ResultadoConCache<T>> => {
    const guardado = await leerJson<EntradaCache<T>>(nombre);
    if (!guardado) {
      throw new ErrorServicio(0, { codigo: 'sin-conexion', mensaje: 'No hay conexión.' });
    }
    return { datos: guardado.datos, desdeCache: true, guardadoEn: guardado.guardadoEn };
  };

  if (!(await hayRed())) return desdeTelefono();
  try {
    const datos = await cargar();
    const guardadoEn = new Date().toISOString();
    escribirJson(nombre, { datos, guardadoEn });
    return { datos, desdeCache: false, guardadoEn };
  } catch (error) {
    if (esSinConexion(error)) return desdeTelefono();
    throw error;
  }
}
