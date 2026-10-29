import { useCallback, useEffect, useState } from 'react';
import { observacionesService } from '@/services';
import type { EstadoObservacion, ObservacionDetalle } from '@/types';

/** Estados en los que la inferencia aún no termina. */
const ESTADOS_EN_CURSO: EstadoObservacion[] = ['recibido', 'procesando'];

/** Espera entre consultas: crece hasta 8 s (backoff). */
const ESPERAS_MS = [1000, 2000, 4000, 8000];

/** Tras este tiempo se deja de consultar y se sugiere revisar más tarde. */
const LIMITE_MS = 2 * 60 * 1000;

export function estaEnCurso(estado: EstadoObservacion): boolean {
  return ESTADOS_EN_CURSO.includes(estado);
}

/**
 * Consulta GET /observaciones/{id} mientras la observación esté en `recibido`
 * o `procesando`, y se detiene al llegar a cualquier otro estado.
 * Como el contrato no tiene notificaciones, este polling es la única vía.
 */
export function useSeguimientoObservacion(id: string) {
  const [observacion, setObservacion] = useState<ObservacionDetalle | null>(
    null,
  );
  const [error, setError] = useState<unknown>(null);
  const [agotado, setAgotado] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    const inicio = Date.now();
    let consultas = 0;

    async function consultar() {
      try {
        const detalle = await observacionesService.obtenerObservacion(id);
        if (!activo) return;
        setObservacion(detalle);

        if (!estaEnCurso(detalle.estado)) return;
        if (Date.now() - inicio >= LIMITE_MS) {
          setAgotado(true);
          return;
        }
        const espera =
          ESPERAS_MS[Math.min(consultas, ESPERAS_MS.length - 1)];
        consultas += 1;
        temporizador = setTimeout(() => void consultar(), espera);
      } catch (e) {
        if (activo) setError(e);
      }
    }

    void consultar();

    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [id, intento]);

  const reintentar = useCallback(() => {
    setError(null);
    setAgotado(false);
    setIntento((n) => n + 1);
  }, []);

  return { observacion, error, agotado, reintentar };
}
