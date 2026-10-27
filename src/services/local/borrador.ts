import { borrarJson, escribirJson, leerJson } from './almacen';

/** Foto elegida en el paso 1, con lo necesario para volver a mostrarla y enviarla. */
export interface FotoBorrador {
  uri: string;
  width: number;
  height: number;
  mimeType: string | null;
  fileName: string | null;
}

/** Formulario de nueva observación a medias (los 3 pasos). */
export interface BorradorObservacion {
  foto: FotoBorrador | null;
  coordenadas: { latitud: number | null; longitud: number | null };
  textoCoordenadas: { latitud: string; longitud: string };
  precisionGps: number | null;
  /** ISO 8601 de la fecha y hora del evento. */
  fechaEvento: string;
  tipoAmbiente: string | null;
  condicion: string | null;
  notas: string;
  paso: number;
  guardadoEn: string;
}

/** Un borrador por usuario: así no aparece el de otra cuenta en el mismo teléfono. */
const nombre = (usuarioId: string) => `borrador-${usuarioId}`;

export function leerBorrador(usuarioId: string): Promise<BorradorObservacion | null> {
  return leerJson<BorradorObservacion>(nombre(usuarioId));
}

export function guardarBorrador(usuarioId: string, borrador: BorradorObservacion): boolean {
  return escribirJson(nombre(usuarioId), borrador);
}

export function borrarBorrador(usuarioId: string): void {
  borrarJson(nombre(usuarioId));
}

/** true si el borrador tiene algo que valga la pena recuperar. */
export function borradorTieneDatos(b: BorradorObservacion): boolean {
  return (
    b.foto !== null ||
    b.textoCoordenadas.latitud.trim() !== '' ||
    b.textoCoordenadas.longitud.trim() !== '' ||
    b.tipoAmbiente !== null ||
    b.condicion !== null ||
    b.notas.trim() !== ''
  );
}
