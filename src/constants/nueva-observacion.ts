import type * as ImagePicker from 'expo-image-picker';
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
 * Tipo de la imagen. Algunos Android no informan `mimeType`; en ese caso
 * se deduce de la extensión del archivo.
 */
export function tipoImagen(
  asset: ImagePicker.ImagePickerAsset,
): ImagenObservacion['mimeType'] | null {
  const mimeType = asset.mimeType?.toLowerCase();
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'image/jpeg';
  if (mimeType === 'image/png') return 'image/png';
  if (mimeType) return null;

  const extension = /\.(\w+)(?:\?.*)?$/
    .exec(asset.fileName ?? asset.uri)?.[1]
    ?.toLowerCase();
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'png') return 'image/png';
  return null;
}

export function imagenParaEnvio(asset: ImagePicker.ImagePickerAsset): ImagenObservacion {
  // validateImageAsset ya garantizó JPEG o PNG.
  const mimeType = tipoImagen(asset) ?? 'image/jpeg';
  const extension = mimeType === 'image/png' ? 'png' : 'jpg';
  return {
    uri: asset.uri,
    mimeType,
    nombre: asset.fileName ?? `observacion.${extension}`,
  };
}

export const PASOS = ['Foto', 'Dónde y cuándo', 'Sobre el animal'] as const;

export function validateImageAsset(asset: ImagePicker.ImagePickerAsset) {
  const hasValidFormat = tipoImagen(asset) !== null;
  const hasValidSize = Math.max(asset.width, asset.height) >= 1280;

  return {
    isValid: hasValidFormat && hasValidSize,
    hasValidFormat,
    hasValidSize,
  };
}
