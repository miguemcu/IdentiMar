import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { observacionesService } from '@/services';
import { conCache } from '@/services/local/cache';
import { esSinConexion } from '@/services/local/cola-envio';
import { useAlVolverLaSenal } from './use-al-volver-la-senal';
import type { EstadoObservacion, ObservacionResumen } from '@/types';

/**
 * Estados en los que la observación siempre tiene una especie aceptada.
 * `corregido` se cuenta aparte: un rechazo del experto también termina ahí,
 * pero sin especie.
 */
const ESTADOS_IDENTIFICADOS: EstadoObservacion[] = ['identificado', 'validado'];

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
  const { usuario } = useAuth();
  // Sin conexión: fecha de la copia mostrada, o null si no hay copia.
  const [sinConexion, setSinConexion] = useState<{ guardadoEn: string | null } | null>(null);

  const cargar = useCallback(async () => {
    setError(false);
    if (!usuario) return;
    const calcular = async (): Promise<ResumenRegistros> => {
      const contar = (estado: EstadoObservacion) =>
        observacionesService
          .listarObservaciones({ estado, tamano: 1 })
          .then((pagina) => pagina.total);

      // Corregidas con especie, sobre una página de hasta 100 (máximo del contrato).
      const corregidasConEspecie = observacionesService
        .listarObservaciones({ estado: 'corregido', tamano: 100 })
        .then((pagina) => pagina.items.filter((obs) => obs.especie_aceptada).length);

      const [recientes, enRevision, corregidas, ...identificadas] = await Promise.all([
        observacionesService.listarObservaciones({ tamano: cantidadUltimos }),
        contar('pendiente_experto'),
        corregidasConEspecie,
        ...ESTADOS_IDENTIFICADOS.map(contar),
      ]);

      return {
        total: recientes.total,
        identificadas: corregidas + identificadas.reduce((suma, n) => suma + n, 0),
        enRevision,
        ultimos: recientes.items,
      };
    };
    try {
      const r = await conCache(`resumen-${usuario.id}`, calcular);
      setResumen(r.datos);
      setSinConexion(r.desdeCache ? { guardadoEn: r.guardadoEn } : null);
    } catch (e) {
      setSinConexion(esSinConexion(e) ? { guardadoEn: null } : null);
      setError(true);
    }
  }, [cantidadUltimos, usuario]);

  useAlVolverLaSenal(sinConexion !== null, () => void cargar());

  useFocusEffect(
    useCallback(() => {
      queueMicrotask(() => {
        void cargar();
      });
    }, [cargar]),
  );

  return { resumen, error, sinConexion, recargar: cargar };
}
