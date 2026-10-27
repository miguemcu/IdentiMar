import { File } from 'expo-file-system';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  borradorTieneDatos,
  borrarBorrador,
  guardarBorrador,
  leerBorrador,
  type BorradorObservacion,
} from '@/services/local/borrador';

/** Espera tras el último cambio antes de escribir en el dispositivo. */
const ESPERA_GUARDADO_MS = 500;

/** La ruta de la foto puede ser temporal: si ya no existe, se descarta. */
function fotoSigueDisponible(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

/**
 * Borrador local de la nueva observación. Lee el borrador una vez al entrar
 * (`restaurado`) y guarda el formulario poco después de cada cambio. Hasta que
 * `listo` es true no se guarda nada, para no pisar el borrador antes de leerlo.
 */
export function useBorradorObservacion(
  usuarioId: string | undefined,
  aplicar: (borrador: BorradorObservacion) => void,
) {
  const [restaurado, setRestaurado] = useState<BorradorObservacion | null>(null);
  const [fotoPerdida, setFotoPerdida] = useState(false);
  const [listo, setListo] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Se lee al restaurar; así cambiar la función no vuelve a leer el borrador.
  const aplicarRef = useRef(aplicar);
  useEffect(() => {
    aplicarRef.current = aplicar;
  });

  useEffect(() => {
    let activo = true;
    if (!usuarioId) return;
    void leerBorrador(usuarioId).then((borrador) => {
      if (!activo) return;
      if (borrador && borradorTieneDatos(borrador)) {
        const usable =
          borrador.foto && !fotoSigueDisponible(borrador.foto.uri)
            ? { ...borrador, foto: null, paso: 0 }
            : borrador;
        setFotoPerdida(usable !== borrador);
        setRestaurado(usable);
        aplicarRef.current(usable);
      }
      setListo(true);
    });
    return () => {
      activo = false;
      clearTimeout(temporizador.current);
    };
  }, [usuarioId]);

  const guardar = useCallback(
    (borrador: Omit<BorradorObservacion, 'guardadoEn'>) => {
      if (!usuarioId || !listo) return;
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => {
        const completo = { ...borrador, guardadoEn: new Date().toISOString() };
        if (borradorTieneDatos(completo)) guardarBorrador(usuarioId, completo);
        else borrarBorrador(usuarioId);
      }, ESPERA_GUARDADO_MS);
    },
    [usuarioId, listo],
  );

  /** Borra el borrador guardado (al enviar con éxito o al empezar de nuevo). */
  const limpiar = useCallback(() => {
    clearTimeout(temporizador.current);
    if (usuarioId) borrarBorrador(usuarioId);
    setRestaurado(null);
    setFotoPerdida(false);
  }, [usuarioId]);

  return { restaurado, fotoPerdida, listo, guardar, limpiar };
}
