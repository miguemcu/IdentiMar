import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { observacionesService } from '@/services';
import type { EstadoObservacion, ObservacionResumen } from '@/types';

/** Estados en los que la observación ya tiene una especie aceptada. */
const ESTADOS_IDENTIFICADOS: EstadoObservacion[] = [
  'identificado',
  'validado',
  'corregido',
];

export interface ResumenRegistros {
  total: number;
  identificadas: number;
  enRevision: number;
  ultimos: ObservacionResumen[];
}

/**
 * Cifras de las observaciones del usuario a partir de GET /observaciones:
 * cada conteo usa el `total` de una consulta filtrada por `estado` (tamano 1),
 * así no hay que descargar todo el listado. Se recarga al volver a la pantalla.
 */
export function useResumenRegistros(cantidadUltimos = 3) {
  const [resumen, setResumen] = useState<ResumenRegistros | null>(null);
  const [error, setError] = useState(false);

  const cargar = useCallback(async () => {
    setError(false);
    try {
      const contar = (estado: EstadoObservacion) =>
        observacionesService
          .listarObservaciones({ estado, tamano: 1 })
          .then((pagina) => pagina.total);

      const [recientes, enRevision, ...identificadas] = await Promise.all([
        observacionesService.listarObservaciones({ tamano: cantidadUltimos }),
        contar('pendiente_experto'),
        ...ESTADOS_IDENTIFICADOS.map(contar),
      ]);

      setResumen({
        total: recientes.total,
        identificadas: identificadas.reduce((suma, n) => suma + n, 0),
        enRevision,
        ultimos: recientes.items,
      });
    } catch {
      setError(true);
    }
  }, [cantidadUltimos]);

  useFocusEffect(
    useCallback(() => {
      queueMicrotask(() => {
        void cargar();
      });
    }, [cargar]),
  );

  return { resumen, error, recargar: cargar };
}
