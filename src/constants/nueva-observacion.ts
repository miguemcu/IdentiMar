import type * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import type { ImagenObservacion } from '@/services';

export type TemporaryCoordinates = {
  latitud: number | null;
  longitud: number | null;
};

export type CoordinateField = keyof TemporaryCoordinates;

export const MAX_NOTAS = 2000;

export const RANGO_COORDENADA: Record<CoordinateField, number> = {
  latitud: 90,
  longitud: 180,
};

export function errorCoordenada(
  field: CoordinateField,
  texto: string,
  valor: number | null,
) {
  if (texto.trim() === '') return undefined;
  if (valor === null) return 'Escribe un número, por ejemplo 8.123456';
  const max = RANGO_COORDENADA[field];
  return Math.abs(valor) > max ? `Debe estar entre -${max} y ${max}` : undefined;
}

/**
 * Lo que acepta el modelo de identificación (acordado con los Equipos 2 y 3):
 * JPG, PNG o WEBP, al menos 32 px por lado y hasta 10 MB.
 */
export const LADO_MINIMO_PX = 32;
export const PESO_MAXIMO_BYTES = 10 * 1024 * 1024;

const TIPO_POR_EXTENSION: Record<string, ImagenObservacion['mimeType']> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const EXTENSION_POR_TIPO: Record<ImagenObservacion['mimeType'], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

/**
 * Tipo de la imagen. Algunos Android no informan `mimeType`; en ese caso
 * se deduce de la extensión del archivo.
 */
export function tipoImagen(
  asset: ImagePicker.ImagePickerAsset,
): ImagenObservacion['mimeType'] | null {
  const mimeType = asset.mimeType?.toLowerCase();
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'image/jpeg';
  if (mimeType === 'image/png' || mimeType === 'image/webp') return mimeType;
  if (mimeType) return null;

  const extension = /\.(\w+)(?:\?.*)?$/
    .exec(asset.fileName ?? asset.uri)?.[1]
    ?.toLowerCase();
  return (extension && TIPO_POR_EXTENSION[extension]) || null;
}

/**
 * Peso de la foto en bytes. Algunos teléfonos no lo informan en el asset; en
 * ese caso se lee del archivo. null si no se puede saber.
 */
function pesoImagen(asset: ImagePicker.ImagePickerAsset): number | null {
  if (asset.fileSize) return asset.fileSize;
  try {
    return new File(asset.uri).size ?? null;
  } catch {
    return null;
  }
}

export function imagenParaEnvio(asset: ImagePicker.ImagePickerAsset): ImagenObservacion {
  // validateImageAsset ya garantizó un tipo aceptado.
  const mimeType = tipoImagen(asset) ?? 'image/jpeg';
  return {
    uri: asset.uri,
    mimeType,
    nombre: asset.fileName ?? `observacion.${EXTENSION_POR_TIPO[mimeType]}`,
  };
}

export const PASOS = ['Foto', 'Dónde y cuándo', 'Sobre el animal'] as const;

export function validateImageAsset(asset: ImagePicker.ImagePickerAsset) {
  const hasValidFormat = tipoImagen(asset) !== null;
  const hasValidSize = Math.min(asset.width, asset.height) >= LADO_MINIMO_PX;
  // Si no se sabe el peso, se deja pasar: el servidor responde 413 si sobra.
  const peso = pesoImagen(asset);
  const hasValidWeight = peso === null || peso <= PESO_MAXIMO_BYTES;

  return {
    isValid: hasValidFormat && hasValidSize && hasValidWeight,
    hasValidFormat,
    hasValidSize,
    hasValidWeight,
  };
}
