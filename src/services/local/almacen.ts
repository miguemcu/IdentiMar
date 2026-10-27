import { Directory, File, Paths } from 'expo-file-system';

/**
 * Datos locales de la app (borrador, cola, caché) como archivos JSON en el
 * directorio de documentos. Nunca lanza: si el dispositivo no deja leer o
 * escribir, devuelve null o false y la app sigue sin la copia local.
 */
const RAIZ = new Directory(Paths.document, 'identimar');

function asegurarRaiz(): void {
  if (!RAIZ.exists) RAIZ.create({ intermediates: true, idempotent: true });
}

function archivo(nombre: string): File {
  return new File(RAIZ, `${nombre}.json`);
}

export async function leerJson<T>(nombre: string): Promise<T | null> {
  try {
    const f = archivo(nombre);
    if (!f.exists) return null;
    return JSON.parse(await f.text()) as T;
  } catch {
    return null;
  }
}

export function escribirJson(nombre: string, datos: unknown): boolean {
  try {
    asegurarRaiz();
    const f = archivo(nombre);
    if (!f.exists) f.create({ overwrite: true });
    f.write(JSON.stringify(datos));
    return true;
  } catch {
    return false;
  }
}

export function borrarJson(nombre: string): void {
  try {
    const f = archivo(nombre);
    if (f.exists) f.delete();
  } catch {
    // Si no se puede borrar, la próxima escritura lo reemplaza.
  }
}
