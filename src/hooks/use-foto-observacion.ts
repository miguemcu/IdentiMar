import { useCallback, useEffect, useState } from 'react';
import { observacionesService } from '@/services';
import type { ObservacionResumen } from '@/types';

/**
 * Las URLs firmadas del backend vencen en 1 hora; se reutilizan un poco
 * menos, para no mostrar una vencida.
 */
const VIGENCIA_MS = 50 * 60 * 1000;

const fotos = new Map<string, { url: string; hasta: number }>();
const enCurso = new Map<string, Promise<string | null>>();

function pedirFoto(id: string): Promise<string | null> {
  const guardada = fotos.get(id);
  if (guardada && guardada.hasta > Date.now()) return Promise.resolve(guardada.url);
  let promesa = enCurso.get(id);
  if (!promesa) {
    promesa = observacionesService
      .obtenerObservacion(id)
      .then((detalle) => {
        if (!detalle.imagen_url) return null;
        fotos.set(id, { url: detalle.imagen_url, hasta: Date.now() + VIGENCIA_MS });
        return detalle.imagen_url;
      })
      // Sin señal u otro error: la tarjeta sigue con el ícono.
      .catch(() => null)
      .finally(() => enCurso.delete(id));
    enCurso.set(id, promesa);
  }
  return promesa;
}

/**
 * Foto de una observación para las listas. El contrato la incluye en el
 * listado (`imagen_url`), pero el backend solo la envía en el detalle: si
 * falta, se pide el detalle de esa observación y se guarda en memoria. Las
 * listas solo dibujan las tarjetas visibles, así que son pocas consultas.
 *
 * `alFallar`: la foto no cargó (por ejemplo, venció); se olvida y queda el ícono.
 */
export function useFotoObservacion(observacion: ObservacionResumen) {
  const { id, imagen_url } = observacion;
  const [pedida, setPedida] = useState<string | null>(null);

  useEffect(() => {
    if (imagen_url) return;
    let activo = true;
    void pedirFoto(id).then((url) => {
      if (activo) setPedida(url);
    });
    return () => {
      activo = false;
    };
  }, [id, imagen_url]);

  const alFallar = useCallback(() => {
    fotos.delete(id);
    setPedida(null);
  }, [id]);

  return { url: imagen_url ?? pedida, alFallar };
}
