import { ErrorServicio } from '../errores';

/**
 * Utilidad para simular latencia de red aleatoria entre min y max milisegundos.
 */
export async function simularRetardo(min = 300, max = 800): Promise<void> {
  const tiempo = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, tiempo));
}

/**
 * EXPO_PUBLIC_MOCK_ERROR=red: sin conexión en toda la app simulada (envío,
 * catálogos, listado y detalle de observaciones). Lanza como un fetch sin respuesta.
 */
export function lanzarSiSinRed(): void {
  if (process.env.EXPO_PUBLIC_MOCK_ERROR === 'red') {
    throw new ErrorServicio(0, { codigo: 'sin-conexion', mensaje: 'No hay conexión.' });
  }
}
