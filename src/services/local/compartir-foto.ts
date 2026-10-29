import { Directory, File, Paths } from 'expo-file-system';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

/** Cómo terminó guardar o compartir una foto. */
export type ResultadoFoto = 'ok' | 'sin-permiso' | 'no-disponible' | 'error';

/**
 * Archivo local de la foto. Las de la API son enlaces (firmados o públicos):
 * se descargan a la caché; las del teléfono (mock o copia local) se usan tal cual.
 */
async function archivoLocal(uri: string, nombre: string): Promise<File> {
  if (uri.startsWith('file:')) return new File(uri);
  const carpeta = new Directory(Paths.cache, 'fotos-compartidas');
  if (!carpeta.exists) carpeta.create({ intermediates: true, idempotent: true });
  const destino = new File(carpeta, nombre);
  if (destino.exists) destino.delete();
  return File.downloadFileAsync(uri, destino);
}

/** Nombre del archivo con su extensión, deducida del enlace (jpg si no se sabe). */
export function nombreFoto(uri: string, base: string): string {
  const extension = /\.(jpe?g|png|webp)(?:\?|$)/i.exec(uri)?.[1].toLowerCase() ?? 'jpg';
  return `${base}.${extension === 'jpeg' ? 'jpg' : extension}`;
}

/**
 * Guarda la foto en la galería del teléfono. Pide permiso solo para guardar.
 * En Android, Expo Go no tiene acceso completo a la galería: ahí puede fallar
 * aunque en la app instalada (APK) funcione.
 */
export async function guardarEnGaleria(uri: string, nombre: string): Promise<ResultadoFoto> {
  try {
    const permiso = await requestPermissionsAsync(true, ['photo']);
    if (!permiso.granted) return 'sin-permiso';
    const archivo = await archivoLocal(uri, nombre);
    await Asset.create(archivo.uri);
    return 'ok';
  } catch {
    return 'error';
  }
}

/** Abre el menú de compartir del teléfono (guardar en Fotos, WhatsApp, correo…). */
export async function compartirFoto(uri: string, nombre: string): Promise<ResultadoFoto> {
  try {
    if (!(await isAvailableAsync())) return 'no-disponible';
    const archivo = await archivoLocal(uri, nombre);
    await shareAsync(archivo.uri, { dialogTitle: 'Compartir foto' });
    return 'ok';
  } catch {
    return 'error';
  }
}
