import { File } from 'expo-file-system';
import { carpetaLocal } from './almacen';

const extension = (nombre: string) => (/\.png$/i.test(nombre) ? 'png' : 'jpg');

/**
 * Copia la foto elegida a la carpeta del borrador del usuario, para no
 * depender de la ruta de la cámara o la galería. Deja una sola foto por
 * borrador. Devuelve la ruta de la copia, o null si no se pudo copiar.
 */
export function copiarFotoBorrador(usuarioId: string, uri: string, nombre: string): string | null {
  try {
    // EXPO_PUBLIC_MOCK_ERROR=copia-foto: simula que el teléfono no deja copiar.
    if (process.env.EXPO_PUBLIC_MOCK_ERROR === 'copia-foto') return null;
    const carpeta = carpetaLocal('fotos', `borrador-${usuarioId}`);
    for (const anterior of carpeta.list()) anterior.delete();
    const copia = new File(carpeta, `foto-${Date.now()}.${extension(nombre)}`);
    new File(uri).copySync(copia);
    return copia.uri;
  } catch {
    return null;
  }
}

/**
 * Al enviar, la foto del borrador se copia a `fotos/enviadas`, así borrar el
 * borrador no le quita la foto a la observación enviada. Si no se puede
 * copiar, se envía la ruta que había.
 */
export function reservarFotoParaEnvio(uri: string, nombre: string): string {
  try {
    if (!uri.includes('/identimar/fotos/borrador-')) return uri;
    const destino = new File(carpetaLocal('fotos', 'enviadas'), `foto-${Date.now()}.${extension(nombre)}`);
    new File(uri).copySync(destino);
    return destino.uri;
  } catch {
    return uri;
  }
}

/** Si el envío falla, se quita la copia reservada; el borrador conserva la suya. */
export function liberarFotoReservada(uri: string): void {
  try {
    if (uri.includes('/identimar/fotos/enviadas/')) new File(uri).delete();
  } catch {
    // Una copia de más no afecta a la app.
  }
}

export function borrarFotosBorrador(usuarioId: string): void {
  try {
    const carpeta = carpetaLocal('fotos', `borrador-${usuarioId}`);
    carpeta.delete();
  } catch {
    // Si no se puede borrar, la próxima copia la reemplaza.
  }
}
